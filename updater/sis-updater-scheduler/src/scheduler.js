const { chunk } = require('lodash')
const { eachLimit } = require('async')
const { knexConnection } = require('./db/connection')
const { stan } = require('./utils/stan')
const { incrby: redisIncrementBy, get: redisGet } = require('./utils/redis')
const {
  SIS_UPDATER_SCHEDULE_CHANNEL,
  SIS_MISC_SCHEDULE_CHANNEL,
  CHUNK_SIZE,
  isDev,
  DEV_SCHEDULE_COUNT,
  REDIS_TOTAL_META_KEY,
  REDIS_TOTAL_STUDENTS_KEY,
  REDIS_LAST_HOURLY_SCHEDULE,
  REDIS_LATEST_MESSAGE_RECEIVED,
  LATEST_MESSAGE_RECEIVED_THRESHOLD,
} = require('./config')
const { startPrePurge, startPurge } = require('./purge')
const { logger } = require('./utils/logger')

const IMPORTER_TABLES = {
  attainments: 'attainments',
  organisations: 'organisations',
  studyLevels: 'study_levels',
  educationTypes: 'education_types',
  studyYears: 'study_years',
  courseUnits: 'course_units',
  modules: 'modules',
  persons: 'persons',
  studyrights: 'studyrights',
  termRegistrations: 'term_registrations',
  studyRightPrimalities: 'study_right_primalities',
  degreeTitles: 'degree_titles',
}

const createJobs = async (entityIds, type, channel = SIS_UPDATER_SCHEDULE_CHANNEL) => {
  const redisKey = type === 'students' ? REDIS_TOTAL_STUDENTS_KEY : REDIS_TOTAL_META_KEY
  await redisIncrementBy(redisKey, entityIds.length)

  return new Promise((res, rej) => {
    stan.publish(channel, JSON.stringify({ entityIds, type }), err => {
      if (err) return rej(err)
      res()
    })
  })
}

const scheduleFromDb = async ({
  table,
  distinct,
  pluck = 'id',
  whereNotNull,
  scheduleId,
  limit,
  whereIn,
  clean = true,
}) => {
  const { knex } = knexConnection
  const knexBuilder = knex(table)
  if (distinct) knexBuilder.distinct(distinct)
  if (pluck) knexBuilder.pluck(pluck)
  if (whereNotNull) knexBuilder.whereNotNull(whereNotNull)
  if (limit) knexBuilder.limit(limit)
  if (whereIn) knexBuilder.whereIn(...whereIn)
  if (!clean) {
    const lastHourlySchedule = await redisGet(REDIS_LAST_HOURLY_SCHEDULE)
    if (lastHourlySchedule) knexBuilder.where('updated_at', '>=', new Date(lastHourlySchedule))
  }
  const entities = await knexBuilder
  await eachLimit(chunk(entities, CHUNK_SIZE), 10, async e => await createJobs(e, scheduleId || table))
  return entities.length
}

const scheduleMeta = async (clean = true) => {
  await scheduleFromDb({
    table: IMPORTER_TABLES.organisations,
    clean,
  })

  await scheduleFromDb({
    table: IMPORTER_TABLES.studyLevels,
    clean,
  })

  await scheduleFromDb({
    table: IMPORTER_TABLES.educationTypes,
    clean,
  })

  const creditTypes = [4, 7, 9, 10]
  await createJobs(creditTypes, 'credit_types')

  await scheduleFromDb({
    table: IMPORTER_TABLES.courseUnits,
    distinct: 'group_id',
    pluck: 'group_id',
    limit: isDev ? DEV_SCHEDULE_COUNT : null,
    clean,
  })

  await scheduleFromDb({
    scheduleId: 'study_modules',
    table: IMPORTER_TABLES.modules,
    whereIn: ['type', ['StudyModule', 'DegreeProgramme']],
    distinct: 'group_id',
    pluck: 'group_id',
    limit: isDev ? DEV_SCHEDULE_COUNT : null,
    clean,
  })
}

const scheduleStudents = async () => {
  await scheduleFromDb({
    scheduleId: 'students',
    table: IMPORTER_TABLES.persons,
    whereNotNull: 'student_number',
    pluck: 'id',
    limit: isDev ? DEV_SCHEDULE_COUNT : null,
  })
}

const getHourlyPersonsToUpdate = async () => {
  const { knex } = knexConnection
  const lastHourlySchedule = await redisGet(REDIS_LAST_HOURLY_SCHEDULE)

  const getUpdatedFrom = (table, pluck) => {
    const builder = knex(table).pluck(pluck)
    if (lastHourlySchedule) builder.where('updated_at', '>=', new Date(lastHourlySchedule))
    if (isDev) builder.limit(DEV_SCHEDULE_COUNT)
    return builder
  }

  const [
    updatedPersons,
    updatedAttainmentStudents,
    updatedStudyrightStudents,
    updatedTermRegistrationStudents,
    updatedStudyRightPrimalitiesStudents,
  ] = await Promise.all([
    getUpdatedFrom(IMPORTER_TABLES.persons, 'id').whereNotNull('student_number'),
    getUpdatedFrom(IMPORTER_TABLES.attainments, 'person_id'),
    getUpdatedFrom(IMPORTER_TABLES.studyrights, 'person_id'),
    getUpdatedFrom(IMPORTER_TABLES.termRegistrations, 'student_id'),
    getUpdatedFrom(IMPORTER_TABLES.studyRightPrimalities, 'student_id'),
  ])

  return Array.from(
    new Set([
      ...updatedPersons,
      ...updatedAttainmentStudents,
      ...updatedStudyrightStudents,
      ...updatedTermRegistrationStudents,
      ...updatedStudyRightPrimalitiesStudents,
    ])
  )
}

const scheduleByStudentNumbers = async studentNumbers => {
  const { knex } = knexConnection
  const personsToUpdate = await knex('persons').column('id', 'student_number').whereIn('student_number', studentNumbers)

  await eachLimit(
    chunk(personsToUpdate, CHUNK_SIZE),
    10,
    async s => await createJobs(s, 'students', SIS_MISC_SCHEDULE_CHANNEL)
  )
}

const scheduleByCourseCodes = async courseCodes => {
  const { knex } = knexConnection
  const coursesToUpdate = await knex(IMPORTER_TABLES.courseUnits)
    .whereIn('code', courseCodes)
    .distinct('group_id')
    .pluck('group_id')

  await eachLimit(chunk(coursesToUpdate, CHUNK_SIZE), 10, async c => await createJobs(c, IMPORTER_TABLES.courseUnits))
}

const isUpdaterActive = async () => {
  const latestUpdaterHandledMessage = await redisGet(REDIS_LATEST_MESSAGE_RECEIVED)
  return (
    latestUpdaterHandledMessage &&
    new Date().getTime() - new Date(latestUpdaterHandledMessage).getTime() <= LATEST_MESSAGE_RECEIVED_THRESHOLD
  )
}

const scheduleHourly = async () => {
  try {
    // Update meta that have changed between now and the last update
    await scheduleMeta(false)

    // Update persons whose attainments, studyrights etc. have changed
    // between now and the last update
    const personsToUpdate = await getHourlyPersonsToUpdate()

    await eachLimit(chunk(personsToUpdate, CHUNK_SIZE), 10, async s => await createJobs(s, 'students'))
  } catch (e) {
    logger.error({ message: 'Hourly scheduling failed', meta: e.stack })
  }
}

const scheduleProgrammes = async () => {
  const { knex } = knexConnection

  const modules = await knex('modules').where({ type: 'DegreeProgramme' })

  const entityIds = modules.map(m => m.id)

  createJobs(entityIds, 'programme_modules')
    .then(() => console.log('scheduling programmes', entityIds))
    .catch(e => console.log('Failed upadting modules', e))
}

const scheduleWeekly = async () => {
  try {
    await scheduleMeta()
    await scheduleStudents()
  } catch (e) {
    logger.error({ message: 'Weekly scheduling failed', meta: e.stack })
  }
}

const schedulePrePurge = async () => {
  try {
    await startPrePurge()
  } catch (e) {
    logger.error({ message: 'Purge failed', meta: e.stack })
  }
}

const schedulePurge = async () => {
  try {
    await startPurge()
  } catch (e) {
    logger.error({ message: 'Purge failed', meta: e.stack })
  }
}

module.exports = {
  scheduleMeta,
  scheduleStudents,
  scheduleProgrammes,
  scheduleHourly,
  scheduleWeekly,
  schedulePrePurge,
  schedulePurge,
  scheduleByStudentNumbers,
  scheduleByCourseCodes,
  isUpdaterActive,
}
