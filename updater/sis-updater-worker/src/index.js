const { debounce } = require('lodash')
const { stan, opts } = require('./utils/stan')
const { dbConnections } = require('./db/connection')
const { loadMapsOnDemand } = require('./updater/shared')
const { update, purge, purgeByStudentNumber } = require('./updater')
const { get: redisGet, incrby: redisIncrementBy, set: redisSet } = require('./utils/redis')
const { logger } = require('./utils/logger')
const {
  SIS_UPDATER_SCHEDULE_CHANNEL,
  SIS_PURGE_SCHEDULE_CHANNEL,
  SIS_MISC_SCHEDULE_CHANNEL,
  NATS_GROUP,
  REDIS_TOTAL_META_KEY,
  REDIS_TOTAL_STUDENTS_KEY,
  REDIS_TOTAL_META_DONE_KEY,
  REDIS_TOTAL_STUDENTS_DONE_KEY,
  REDIS_LATEST_MESSAGE_RECEIVED
} = require('./config')

let abortingMessages = false

const resetAbortTimer = debounce(() => {
  abortingMessages = false
  logger.info({ message: 'Scheduled messages are enabled again' })
}, 5000)

const handleMessage = messageHandler => async msg => {
  try {
    if (abortingMessages) {
      logger.info({ message: 'Aborting scheduled message' })
      msg.ack()
      resetAbortTimer()
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
    logger.info({ message: 'Starting to abort scheduled messages' })
    abortingMessages = true
    msg.ack()
    resetAbortTimer()
  }
  if (msg.getData() === 'RELOAD_REDIS') {
    logger.info({ message: 'Starting to reload redis cache' })
    await loadMapsOnDemand()
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

const miscMsgHandler = async miscMessage => {
  const studentNumbers = miscMessage.entityIds.map(s => s.student_number)
  const msgInUpdateFormat = { ...miscMessage, entityIds: miscMessage.entityIds.map(s => s.id)}

  await purgeByStudentNumber(studentNumbers)
  await updateMsgHandler(msgInUpdateFormat)
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

  const miscChannel = stan.subscribe(SIS_MISC_SCHEDULE_CHANNEL, NATS_GROUP, opts)
  miscChannel.on('message', handleMessage(miscMsgHandler))
  miscChannel.on('error', e => {
    logger.error({ message: 'Misc channel error', meta: e.stack })
  })
})
