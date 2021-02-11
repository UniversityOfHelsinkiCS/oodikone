const { chunk } = require('lodash')
const { each, eachLimit } = require('async')
const { knexConnection } = require('./db/connection')
const { stan } = require('./utils/stan')
const { set: redisSet, get: redisGet } = require('./utils/redis')
const {
  SIS_UPDATER_SCHEDULE_CHANNEL,
  SIS_PURGE_SCHEDULE_CHANNEL,
  SIS_MISC_SCHEDULE_CHANNEL,
  CHUNK_SIZE,
  isDev,
  DEV_SCHEDULE_COUNT,
  REDIS_TOTAL_META_KEY,
  REDIS_TOTAL_STUDENTS_KEY,
  REDIS_TOTAL_META_DONE_KEY,
  REDIS_TOTAL_STUDENTS_DONE_KEY,
  REDIS_LAST_HOURLY_SCHEDULE,
  REDIS_LATEST_MESSAGE_RECEIVED,
  LATEST_MESSAGE_RECEIVED_THRESHOLD,
  REDIS_LAST_WEEKLY_SCHEDULE
} = require('./config')
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
  studyRightPrimalities: 'study_right_primalities'
}

const createJobs = async (entityIds, type, channel = SIS_UPDATER_SCHEDULE_CHANNEL) =>
  new Promise((res, rej) => {
    stan.publish(channel, JSON.stringify({ entityIds, type }), err => {
      if (err) return rej(err)
      res()
    })
  })

const scheduleFromDb = async ({
  table,
  distinct,
  pluck = 'id',
  whereNotNull,
  scheduleId,
  limit,
  whereIn,
  clean = true
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
  await redisSet(REDIS_TOTAL_META_DONE_KEY, 0)
  await redisSet(REDIS_TOTAL_META_KEY, 'SCHEDULING...')
  const totalOrganisations = await scheduleFromDb({
    table: IMPORTER_TABLES.organisations,
    clean
  })

  const totalStudyLevels = await scheduleFromDb({
    table: IMPORTER_TABLES.studyLevels,
    clean
  })

  const totalEducationTypes = await scheduleFromDb({
    table: IMPORTER_TABLES.educationTypes,
    clean
  })

  const creditTypes = [4, 7, 9, 10]
  await createJobs(creditTypes, 'credit_types')

  const totalCourseUnits = await scheduleFromDb({
    table: IMPORTER_TABLES.courseUnits,
    distinct: 'group_id',
    pluck: 'group_id',
    limit: isDev ? DEV_SCHEDULE_COUNT : null,
    clean
  })

  const totalStudyModules = await scheduleFromDb({
    scheduleId: 'study_modules',
    table: IMPORTER_TABLES.modules,
    whereIn: ['type', ['StudyModule', 'DegreeProgramme']],
    distinct: 'group_id',
    pluck: 'group_id',
    limit: isDev ? DEV_SCHEDULE_COUNT : null,
    clean
  })

  const totalMeta =
    totalOrganisations +
    totalStudyLevels +
    totalEducationTypes +
    creditTypes.length +
    totalCourseUnits +
    totalStudyModules

  await redisSet(REDIS_TOTAL_META_KEY, totalMeta)
}

const scheduleStudents = async () => {
  await redisSet(REDIS_TOTAL_STUDENTS_DONE_KEY, 0)
  await redisSet(REDIS_TOTAL_STUDENTS_KEY, 'SCHEDULING...')
  const totalStudents = await scheduleFromDb({
    scheduleId: 'students',
    table: IMPORTER_TABLES.persons,
    whereNotNull: 'student_number',
    pluck: 'id',
    limit: isDev ? DEV_SCHEDULE_COUNT : null
  })

  await redisSet(REDIS_TOTAL_STUDENTS_KEY, totalStudents)
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
    updatedStudyRightPrimalitiesStudents
  ] = await Promise.all([
    getUpdatedFrom(IMPORTER_TABLES.persons, 'id').whereNotNull('student_number'),
    getUpdatedFrom(IMPORTER_TABLES.attainments, 'person_id'),
    getUpdatedFrom(IMPORTER_TABLES.studyrights, 'person_id'),
    getUpdatedFrom(IMPORTER_TABLES.termRegistrations, 'student_id'),
    getUpdatedFrom(IMPORTER_TABLES.studyRightPrimalities, 'student_id')
  ])

  return Array.from(
    new Set([
      ...updatedPersons,
      ...updatedAttainmentStudents,
      ...updatedStudyrightStudents,
      ...updatedTermRegistrationStudents,
      ...updatedStudyRightPrimalitiesStudents
    ])
  )
}

const scheduleByStudentNumbers = async studentNumbers => {
  const { knex } = knexConnection
  const personsToUpdate = await knex('persons')
    .column('id', 'student_number')
    .whereIn('student_number', studentNumbers)
  await redisSet(REDIS_TOTAL_STUDENTS_DONE_KEY, 0)
  await redisSet(REDIS_TOTAL_STUDENTS_KEY, personsToUpdate.length)
  await eachLimit(chunk(personsToUpdate, CHUNK_SIZE), 10, async s => await createJobs(s, 'students', SIS_MISC_SCHEDULE_CHANNEL))
}

const scheduleByCourseCodes = async courseCodes => {
  const { knex } = knexConnection
  const coursesToUpdate = await knex(IMPORTER_TABLES.courseUnits)
    .whereIn('code', courseCodes)
    .distinct('group_id')
    .pluck('group_id')
  await redisSet(REDIS_TOTAL_META_DONE_KEY, 0)
  await redisSet(REDIS_TOTAL_META_KEY, coursesToUpdate.length)
  await eachLimit(chunk(coursesToUpdate, CHUNK_SIZE), 10, async c => await createJobs(c, IMPORTER_TABLES.courseUnits))
}

const isUpdaterActive = async () => {
  const latestUpdaterHandledMessage = await redisGet(REDIS_LATEST_MESSAGE_RECEIVED)
  return (
    latestUpdaterHandledMessage &&
    new Date().getTime() - new Date(latestUpdaterHandledMessage).getTime() <= LATEST_MESSAGE_RECEIVED_THRESHOLD
  )
}

const hasWeeklyBeenScheduled = async () => {
  const lastWeeklySchedule = await redisGet(REDIS_LAST_WEEKLY_SCHEDULE)
  const lastHourlySchedule = await redisGet(REDIS_LAST_HOURLY_SCHEDULE)

  return (
    lastWeeklySchedule &&
    lastHourlySchedule &&
    new Date(lastWeeklySchedule).getTime() > new Date(lastHourlySchedule).getTime()
  )
}

const scheduleHourly = async () => {
  try {
    // Update meta that have changed between now and the last update
    await scheduleMeta(false)

    // Update persons whose attainments, studyrights etc. have changed
    // between now and the last update
    const personsToUpdate = await getHourlyPersonsToUpdate()
    await redisSet(REDIS_TOTAL_STUDENTS_DONE_KEY, 0)
    await redisSet(REDIS_TOTAL_STUDENTS_KEY, personsToUpdate.length)
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

const schedulePurge = async () => {
  const TABLES_TO_PURGE = [
    'course',
    'course_providers',
    'course_types',
    'credit',
    'credit_teachers',
    'credit_types',
    'element_details',
    'organization',
    'semester_enrollments',
    'student',
    'studyright',
    'studyright_elements',
    'studyright_extents',
    'teacher'
  ]
  try {
    const lastHourlySchedule = await redisGet(REDIS_LAST_HOURLY_SCHEDULE)
    console.log('PURGE_REDIS_LAST_HOURLY', lastHourlySchedule)

    if (!lastHourlySchedule || Number.isNaN(new Date(lastHourlySchedule).getTime())) {
      throw new Error('Invalid date from hourly schedule')
    }
    each(
      Object.values(TABLES_TO_PURGE),
      async table =>
        new Promise((res, rej) => {
          stan.publish(SIS_PURGE_SCHEDULE_CHANNEL, JSON.stringify({ table, before: lastHourlySchedule }), err => {
            if (err) {
              console.log('failed publishing', err)
              rej()
            }
            res()
          })
        })
    )
  } catch (e) {
    logger.error({ message: 'Purge scheduling failed', meta: e.stack })
  }
}

module.exports = {
  scheduleMeta,
  scheduleStudents,
  scheduleProgrammes,
  scheduleHourly,
  scheduleWeekly,
  schedulePurge,
  scheduleByStudentNumbers,
  scheduleByCourseCodes,
  isUpdaterActive,
  hasWeeklyBeenScheduled
}
