const { stan, opts } = require('./utils/stan')
const { dbConnections } = require('./db/connection')
const { update, purge } = require('./updater')
const { get: redisGet, incrby: redisIncrementBy, set: redisSet } = require('./utils/redis')
const {
  SIS_UPDATER_SCHEDULE_CHANNEL,
  SIS_PURGE_SCHEDULE_CHANNEL,
  NATS_GROUP,
  REDIS_TOTAL_META_KEY,
  REDIS_TOTAL_STUDENTS_KEY,
  REDIS_TOTAL_META_DONE_KEY,
  REDIS_TOTAL_STUDENTS_DONE_KEY,
  REDIS_LATEST_MESSAGE_RECEIVED
} = require('./config')

const handleMessage = messageHandler => async msg => {
  try {
    await messageHandler(JSON.parse(msg.getData()))
  } catch (e) {
    console.log('Failed handling message', e)
  } finally {
    try {
      msg.ack()
      await redisSet(REDIS_LATEST_MESSAGE_RECEIVED, new Date())
    } catch (e) {
      console.log('Failed acking message', e)
    }
  }
}

const logProgress = async updateMsg => {
  const totalScheduled = await redisGet(updateMsg.type === 'students' ? REDIS_TOTAL_STUDENTS_KEY : REDIS_TOTAL_META_KEY)
  const totalDone = await redisIncrementBy(
    updateMsg.type === 'students' ? REDIS_TOTAL_STUDENTS_DONE_KEY : REDIS_TOTAL_META_DONE_KEY,
    updateMsg.entityIds.length
  )
  console.log(`UPDATED ${updateMsg.type === 'students' ? 'STUDENTS' : 'META'}: ${totalDone}/${totalScheduled}`)
}

const updateMsgHandler = async updateMsg => {
  await update(updateMsg)
  await logProgress(updateMsg)
}

const purgeMsgHandler = async purgeMsg => {
  await purge(purgeMsg)
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
  updaterChannel.on('message', handleMessage(updateMsgHandler))
  updaterChannel.on('error', e => {
    console.log('NATS updater channel error', e)
  })

  const purgeChannel = stan.subscribe(SIS_PURGE_SCHEDULE_CHANNEL, NATS_GROUP, opts)
  purgeChannel.on('message', handleMessage(purgeMsgHandler))
  purgeChannel.on('error', e => {
    console.log('NATS purge channel error', e)
  })
})
