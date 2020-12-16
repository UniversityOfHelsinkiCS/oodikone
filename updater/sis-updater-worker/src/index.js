const { stan, opts } = require('./utils/stan')
const { dbConnections } = require('./db/connection')
const { update, purge } = require('./updater')
const { get: redisGet, incrby: redisIncrementBy, set: redisSet } = require('./utils/redis')
const { logger } = require('./utils/logger')
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

let cancelled = false
let i = 0

const handleMessage = messageHandler => async msg => {
  try {
    if (cancelled) {
      console.log('vroom vroom', i++)
      msg.ack()
      return
    } 
    await messageHandler(JSON.parse(msg.getData()))
  } catch (e) {
    logger.error({ message: 'Failed handling message', meta: e.stack })
  } finally {
    try {
      msg.ack()
      await redisSet(REDIS_LATEST_MESSAGE_RECEIVED, new Date())
    } catch (e) {
      logger.error({ message: 'Failed acking message', meta: e.stack })
    }
  }
}

const handleInfoMessage = async msg => {
  if (msg.getData() === 'ABORT') {
    console.log('aborting')
    cancelled = true
    setTimeout(() => {
      cancelled = false
    }, 20000)
    msg.ack()
  }
}

const logProgress = async (updateMsg, startTime) => {
  const totalScheduled = await redisGet(updateMsg.type === 'students' ? REDIS_TOTAL_STUDENTS_KEY : REDIS_TOTAL_META_KEY)
  const totalDone = await redisIncrementBy(
    updateMsg.type === 'students' ? REDIS_TOTAL_STUDENTS_DONE_KEY : REDIS_TOTAL_META_DONE_KEY,
    updateMsg.entityIds.length
  )
  logger.info({
    message: 'Update',
    type: updateMsg.type === 'students' ? 'STUDENTS' : 'META',
    count: updateMsg.entityIds.length,
    done: totalDone,
    scheduled: totalScheduled,
    timems: new Date() - startTime
  })
}

const updateMsgHandler = async updateMsg => {
  const startTime = new Date()
  await update(updateMsg)
  await logProgress(updateMsg, startTime)
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
    logger.error({ message: 'Updater channel error', meta: e.stack })
  })

  const purgeChannel = stan.subscribe(SIS_PURGE_SCHEDULE_CHANNEL, NATS_GROUP, opts)
  purgeChannel.on('message', handleMessage(purgeMsgHandler))
  purgeChannel.on('error', e => {
    logger.error({ message: 'Purge channel error', meta: e.stack })
  })

  const infoChannel = stan.subscribe('SIS_INFO_CHANNEL', NATS_GROUP, opts)
  infoChannel.on('message', handleInfoMessage)
})
