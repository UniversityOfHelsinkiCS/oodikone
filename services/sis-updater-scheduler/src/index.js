const { chunk } = require('lodash')
const { knexConnection } = require('./db/connection')
const { stan } = require('./utils/stan')
const { SIS_UPDATER_SCHEDULE_CHANNEL, CHUNK_SIZE } = require('./config')

const createJobs = studentNumbers => {
  stan.publish(SIS_UPDATER_SCHEDULE_CHANNEL, JSON.stringify(studentNumbers), err => {
    if (err) console.log('failed publishing', err)
  })
}

const scheduleAll = async () =>
  chunk(
    await knexConnection.knex
      .select('student_number')
      .from('persons')
      .whereNotNull('student_number')
      .pluck('student_number'),
    CHUNK_SIZE
  ).forEach(createJobs)

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

knexConnection.on('connect', () => {
  console.log('Knex database connection established successfully')
  scheduleAll()
})
