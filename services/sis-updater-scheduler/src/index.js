const { chunk } = require('lodash')
const { knexConnection } = require('./db/connection')
const { stan } = require('./utils/stan')
const { SIS_UPDATER_SCHEDULE_CHANNEL, CHUNK_SIZE } = require('./config')

const createJobs = personIds => {
  stan.publish(SIS_UPDATER_SCHEDULE_CHANNEL, JSON.stringify(personIds), err => {
    if (err) console.log('failed publishing', err)
  })
}

const scheduleAll = async () =>
  chunk(
    await knexConnection.knex
      .select('student_number', 'id')
      .from('persons')
      .whereNotNull('student_number')
      .pluck('id'),
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

knexConnection.on('connect', async () => {
  console.log('Knex database connection established successfully')
  await scheduleAll()
})
