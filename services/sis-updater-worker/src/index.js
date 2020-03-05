const { stan, opts } = require('./utils/stan')
const { dbConnections } = require('./db/connection')
const { update } = require('./updater')
const { get: redisGet, incrby: redisIncrementBy } = require('./utils/redis')
const {
  SIS_UPDATER_SCHEDULE_CHANNEL,
  NATS_GROUP,
  REDIS_TOTAL_META_KEY,
  REDIS_TOTAL_STUDENTS_KEY,
  REDIS_TOTAL_META_DONE_KEY,
  REDIS_TOTAL_STUDENTS_DONE_KEY
} = require('./config')

const logProgress = async msgData => {
  const totalScheduled = await redisGet(msgData.type === 'students' ? REDIS_TOTAL_STUDENTS_KEY : REDIS_TOTAL_META_KEY)
  const totalDone = await redisIncrementBy(
    msgData.type === 'students' ? REDIS_TOTAL_STUDENTS_DONE_KEY : REDIS_TOTAL_META_DONE_KEY,
    msgData.entityIds.length
  )
  console.log(`UPDATED ${msgData.type === 'students' ? 'STUDENTS' : 'META'}: ${totalDone}/${totalScheduled}`)
}

const msgParser = f => async msg => {
  try {
    const msgData = JSON.parse(msg.getData())
    await f(msgData)
    await logProgress(msgData)
  } catch (e) {
    console.log('Updating failed', e)
  } finally {
    try {
      msg.ack()
    } catch (e) {
      console.log('Failed acking message', e)
    }
  }
}

stan.on('error', e => {
  console.log('NATS connection failed', e)
  if (!process.env.CI) process.exit(1)
})

stan.on('connect', ({ clientID }) => {
  console.log(`Connected to NATS as ${clientID}`)
  dbConnections.connect()
})

dbConnections.on('error', () => {
  console.log('DB connections failed')
  if (!process.env.CI) process.exit(1)
})

dbConnections.on('connect', async () => {
  console.log('DB connections established')
  const updaterChannel = stan.subscribe(SIS_UPDATER_SCHEDULE_CHANNEL, NATS_GROUP, opts)
  updaterChannel.on('message', msgParser(update))
  updaterChannel.on('error', e => {
    console.log('NATS updater channel error', e)
  })
})
