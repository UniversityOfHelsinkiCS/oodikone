const { chunk } = require('lodash')
const { eachLimit } = require('async')
const { knexConnection } = require('./db/connection')
const { stan } = require('./utils/stan')
const { set: redisSet } = require('./utils/redis')
const {
  SIS_UPDATER_SCHEDULE_CHANNEL,
  CHUNK_SIZE,
  isDev,
  REDIS_TOTAL_META_KEY,
  REDIS_TOTAL_STUDENTS_KEY,
  REDIS_TOTAL_META_DONE_KEY,
  REDIS_TOTAL_STUDENTS_DONE_KEY
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

const scheduleFromDb = async ({ table, distinct, pluck = 'id', whereNotNull, scheduleId, limit, where }) => {
  const { knex } = knexConnection
  const knexBuilder = knex(table)
  if (distinct) knexBuilder.distinct(distinct)
  if (pluck) knexBuilder.pluck(pluck)
  if (whereNotNull) knexBuilder.whereNotNull(whereNotNull)
  if (limit) knexBuilder.limit(limit)
  if (where) knexBuilder.where(...where)
  const entities = await knexBuilder
  await eachLimit(chunk(entities, CHUNK_SIZE), 10, async e => await createJobs(e, scheduleId || table))
  return entities.length
}

const scheduleMeta = async () => {
  await redisSet(REDIS_TOTAL_META_DONE_KEY, 0)
  await redisSet(REDIS_TOTAL_META_KEY, 'SCHEDULING...')
  const totalOrganisations = await scheduleFromDb({
    table: 'organisations'
  })

  const totalStudyLevels = await scheduleFromDb({
    table: 'study_levels'
  })

  const totalEducationTypes = await scheduleFromDb({
    table: 'education_types'
  })

  const totalStudyYears = await scheduleFromDb({
    table: 'study_years',
    distinct: 'org',
    pluck: 'org'
  })

  const creditTypes = [4, 7, 9, 10]
  await createJobs(creditTypes, 'credit_types')

  const totalCourseUnits = await scheduleFromDb({
    table: 'course_units',
    distinct: 'group_id',
    pluck: 'group_id',
    limit: isDev ? 100 : null
  })

  const totalStudyModules = await scheduleFromDb({
    scheduleId: 'study_modules',
    table: 'modules',
    where: ['type', 'StudyModule'],
    distinct: 'group_id',
    pluck: 'group_id',
    limit: isDev ? 100 : null
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

const scheduleStudents = async () => {
  await redisSet(REDIS_TOTAL_STUDENTS_DONE_KEY, 0)
  await redisSet(REDIS_TOTAL_STUDENTS_KEY, 'SCHEDULING...')
  const totalStudents = await scheduleFromDb({
    scheduleId: 'students',
    table: 'persons',
    whereNotNull: 'student_number',
    pluck: 'id',
    limit: isDev ? 100 : null
  })

  await redisSet(REDIS_TOTAL_STUDENTS_KEY, totalStudents)
}

module.exports = {
  scheduleMeta,
  scheduleStudents
}
