const { chunk } = require('lodash')
const { knexConnection } = require('./db/connection')
const { stan } = require('./utils/stan')
const { SIS_UPDATER_SCHEDULE_CHANNEL, CHUNK_SIZE } = require('./config')

const createJobs = (entityIds, type) => {
  stan.publish(SIS_UPDATER_SCHEDULE_CHANNEL, JSON.stringify({ entityIds, type }), err => {
    if (err) console.log('failed publishing', err)
  })
}

const scheduleSomeStudents = async (limit = 100) =>
  chunk(
    await knexConnection
      .knex('persons')
      .select('student_number', 'id')
      .whereNotNull('student_number')
      .limit(limit)
      .pluck('id'),
    CHUNK_SIZE
  ).forEach(s => createJobs(s, 'students'))

const scheduleSomeMeta = async (table, limit = 100, pluck = 'id') => {
  chunk(
    await knexConnection
      .knex(table)
      .limit(limit)
      .pluck(pluck),
    CHUNK_SIZE
  ).forEach(e => createJobs(e, table))
}

const scheduleSomeStudyYears = async (limit = 100) =>
  chunk(
    await knexConnection
      .knex('study_years')
      .distinct('org')
      .pluck('org')
      .limit(limit),
    CHUNK_SIZE
  ).forEach(e => createJobs(e, 'study_years'))

const scheduleSomeStudyModules = async (limit = 100) =>
  chunk(
    await knexConnection
      .knex('modules')
      .where('type', 'StudyModule')
      .distinct('group_id')
      .pluck('group_id')
      .limit(limit),
    CHUNK_SIZE
  ).forEach(e => createJobs(e, 'study_modules'))

const scheduleSomeCourseUnits = async (limit = 100) =>
  chunk(
    await knexConnection
      .knex('course_units')
      .distinct('group_id')
      .pluck('group_id')
      .limit(limit),
    CHUNK_SIZE
  ).forEach(e => createJobs(e, 'course_units'))

const scheduleCreditTypeCodes = () => createJobs([4, 7, 9, 10], 'credit_types')

stan.on('error', () => {
  console.log('NATS connection failed')
})

stan.on('connect', ({ clientID }) => {
  console.log(`Connected to NATS as ${clientID}`)
  knexConnection.connect()
})

knexConnection.on('error', e => {
  console.log('Knex database connection failed', e)
})

knexConnection.on('connect', async () => {
  console.log('Knex database connection established successfully')

  // META
  await scheduleSomeMeta('organisations', 1000000)
  await scheduleSomeMeta('study_levels', 1000000)
  await scheduleSomeCourseUnits(1000000)
  await scheduleSomeStudyModules(1000000)
  await scheduleSomeStudyYears(1000000)
  await scheduleCreditTypeCodes()

  // META needs to be in DB before students (courses etc.)
  await scheduleSomeStudents(500000)
})
