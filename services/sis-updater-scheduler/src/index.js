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

const scheduleSomeMeta = async (table, limit = 100) => {
  chunk(
    await knexConnection
      .knex(table)
      .limit(limit)
      .pluck('id'),
    CHUNK_SIZE
  ).forEach(e => createJobs(e, table))
}

const scheduleSomeCourseUnits = async (limit = 100) =>
  chunk(
    await knexConnection
      .knex('course_units')
      .distinct('group_id')
      .pluck('group_id')
      .limit(limit),
    CHUNK_SIZE
  ).forEach(e => createJobs(e, 'course_units'))

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

  // IN DB
  await scheduleSomeMeta('organisations')
  await scheduleSomeCourseUnits()

  // POC
  await scheduleSomeMeta('modules')
  await scheduleSomeMeta('educations')
  await scheduleSomeMeta('assessment_items')
  await scheduleSomeMeta('course_unit_realisations')
  await scheduleSomeStudents()
})
