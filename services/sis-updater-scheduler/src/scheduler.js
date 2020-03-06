const { chunk } = require('lodash')
const { eachLimit } = require('async')
const { knexConnection } = require('./db/connection')
const { stan } = require('./utils/stan')
const { set: redisSet, get: redisGet } = require('./utils/redis')
const {
  SIS_UPDATER_SCHEDULE_CHANNEL,
  CHUNK_SIZE,
  isDev,
  DEV_SCHEDULE_COUNT,
  REDIS_TOTAL_META_KEY,
  REDIS_TOTAL_STUDENTS_KEY,
  REDIS_TOTAL_META_DONE_KEY,
  REDIS_TOTAL_STUDENTS_DONE_KEY,
  REDIS_LAST_HOURLY_SCHEDULE
} = require('./config')

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
    const lastDailySchedule = await redisGet(REDIS_LAST_HOURLY_SCHEDULE)
    if (lastDailySchedule) knexBuilder.where('updated_at', '>=', new Date(lastDailySchedule))
  }
  const entities = await knexBuilder
  await eachLimit(chunk(entities, CHUNK_SIZE), 10, async e => await createJobs(e, scheduleId || table))
  return entities.length
}

const scheduleMeta = async (clean = true) => {
  await redisSet(REDIS_TOTAL_META_DONE_KEY, 0)
  await redisSet(REDIS_TOTAL_META_KEY, 'SCHEDULING...')
  const totalOrganisations = await scheduleFromDb({
    table: 'organisations',
    clean
  })

  const totalStudyLevels = await scheduleFromDb({
    table: 'study_levels',
    clean
  })

  const totalEducationTypes = await scheduleFromDb({
    table: 'education_types',
    clean
  })

  const totalStudyYears = await scheduleFromDb({
    table: 'study_years',
    distinct: 'org',
    pluck: 'org',
    clean
  })

  const creditTypes = [4, 7, 9, 10]
  await createJobs(creditTypes, 'credit_types')

  const totalCourseUnits = await scheduleFromDb({
    table: 'course_units',
    distinct: 'group_id',
    pluck: 'group_id',
    limit: isDev ? DEV_SCHEDULE_COUNT : null,
    clean
  })

  const totalStudyModules = await scheduleFromDb({
    scheduleId: 'study_modules',
    table: 'modules',
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
    table: 'persons',
    whereNotNull: 'student_number',
    pluck: 'id',
    limit: isDev ? DEV_SCHEDULE_COUNT : null,
    clean
  })

  await redisSet(REDIS_TOTAL_STUDENTS_KEY, totalStudents)
}

const scheduleHourly = async () => {
  await scheduleMeta(false)
  await scheduleStudents(false)
  await redisSet(REDIS_LAST_HOURLY_SCHEDULE, new Date())
}

const scheduleWeekly = async () => {
  await scheduleMeta()
  await scheduleStudents()

  // TODO: PURGE
}

module.exports = {
  scheduleMeta,
  scheduleStudents,
  scheduleHourly,
  scheduleWeekly
}
