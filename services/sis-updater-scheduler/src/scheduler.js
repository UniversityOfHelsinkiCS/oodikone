const { chunk } = require('lodash')
const { eachLimit } = require('async')
const { knexConnection } = require('./db/connection')
const { stan } = require('./utils/stan')
const { SIS_UPDATER_SCHEDULE_CHANNEL, CHUNK_SIZE, isDev } = require('./config')

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
  await eachLimit(chunk(await knexBuilder, CHUNK_SIZE), 10, async e => await createJobs(e, scheduleId || table))
}

const scheduleMeta = async () => {
  await scheduleFromDb({
    table: 'organisations'
  })

  await scheduleFromDb({
    table: 'study_levels'
  })

  await scheduleFromDb({
    table: 'education_types'
  })

  await scheduleFromDb({
    table: 'study_years',
    distinct: 'org',
    pluck: 'org'
  })

  await createJobs([4, 7, 9, 10], 'credit_types')

  await scheduleFromDb({
    table: 'course_units',
    distinct: 'group_id',
    pluck: 'group_id',
    limit: isDev ? 100 : null
  })

  await scheduleFromDb({
    scheduleId: 'study_modules',
    table: 'modules',
    where: ['type', 'StudyModule'],
    distinct: 'group_id',
    pluck: 'group_id',
    limit: isDev ? 100 : null
  })
}

const scheduleStudents = async () => {
  await scheduleFromDb({
    scheduleId: 'students',
    table: 'persons',
    whereNotNull: 'student_number',
    pluck: 'id',
    limit: isDev ? 1000 : null
  })
}

module.exports = {
  scheduleMeta,
  scheduleStudents
}
