const { chunk } = require('lodash')
const { each, eachLimit } = require('async')
const { knexConnection } = require('./db/connection')
const { stan } = require('./utils/stan')
const { set: redisSet, get: redisGet } = require('./utils/redis')
const {
  SIS_UPDATER_SCHEDULE_CHANNEL,
  SIS_PURGE_SCHEDULE_CHANNEL,
  CHUNK_SIZE,
  isDev,
  DEV_SCHEDULE_COUNT,
  REDIS_TOTAL_META_KEY,
  REDIS_TOTAL_STUDENTS_KEY,
  REDIS_TOTAL_META_DONE_KEY,
  REDIS_TOTAL_STUDENTS_DONE_KEY,
  REDIS_LAST_HOURLY_SCHEDULE,
  REDIS_LATEST_MESSAGE_RECEIVED,
  LATEST_MESSAGE_RECEIVED_THRESHOLD
} = require('./config')

const IMPORTER_TABLES = {
  organisations: 'organisations',
  studyLevels: 'study_levels',
  educationTypes: 'education_types',
  studyYears: 'study_years',
  courseUnits: 'course_units',
  modules: 'modules',
  persons: 'persons'
}

const createJobs = async (entityIds, type) =>
  new Promise((res, rej) => {
    stan.publish(SIS_UPDATER_SCHEDULE_CHANNEL, JSON.stringify({ entityIds, type }), err => {
      if (err) {
        console.log('failed publishing', err)
        rej()
      }
      res()
    })
  })

const scheduleFromDb = async ({ table, distinct, pluck = 'id', whereNotNull, scheduleId, limit, where, clean }) => {
  const { knex } = knexConnection
  const knexBuilder = knex(table)
  if (distinct) knexBuilder.distinct(distinct)
  if (pluck) knexBuilder.pluck(pluck)
  if (whereNotNull) knexBuilder.whereNotNull(whereNotNull)
  if (limit) knexBuilder.limit(limit)
  if (where) knexBuilder.where(...where)
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

  const totalStudyYears = await scheduleFromDb({
    table: IMPORTER_TABLES.studyYears,
    distinct: 'org',
    pluck: 'org',
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
    where: ['type', 'StudyModule'],
    distinct: 'group_id',
    pluck: 'group_id',
    limit: isDev ? DEV_SCHEDULE_COUNT : null,
    clean
  })

  const totalMeta =
    totalOrganisations +
    totalStudyLevels +
    totalEducationTypes +
    totalStudyYears +
    creditTypes.length +
    totalCourseUnits +
    totalStudyModules

  await redisSet(REDIS_TOTAL_META_KEY, totalMeta)
}

const scheduleStudents = async (clean = true) => {
  await redisSet(REDIS_TOTAL_STUDENTS_DONE_KEY, 0)
  await redisSet(REDIS_TOTAL_STUDENTS_KEY, 'SCHEDULING...')
  const totalStudents = await scheduleFromDb({
    scheduleId: 'students',
    table: IMPORTER_TABLES.persons,
    whereNotNull: 'student_number',
    pluck: 'id',
    limit: isDev ? DEV_SCHEDULE_COUNT : null,
    clean
  })

  await redisSet(REDIS_TOTAL_STUDENTS_KEY, totalStudents)
}

const scheduleHourly = async () => {
  const latestUpdaterHandledMessage = await redisGet(REDIS_LATEST_MESSAGE_RECEIVED)
  if (
    !isDev &&
    latestUpdaterHandledMessage &&
    new Date().getTime() - new Date(latestUpdaterHandledMessage).getTime() <= LATEST_MESSAGE_RECEIVED_THRESHOLD
  ) {
    return
  }

  await scheduleMeta(false)
  await scheduleStudents(false)
  await redisSet(REDIS_LAST_HOURLY_SCHEDULE, new Date())
}

const scheduleWeekly = async () => {
  await scheduleMeta()
  await scheduleStudents()
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
    'semesters',
    'student',
    'studyright',
    'studyright_elements',
    'studyright_extents',
    'teacher'
  ]
  const lastHourlySchedule = await redisGet(REDIS_LAST_HOURLY_SCHEDULE)
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
}

module.exports = {
  scheduleMeta,
  scheduleStudents,
  scheduleHourly,
  scheduleWeekly,
  schedulePurge
}
