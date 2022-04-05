const { stan, opts } = require('./utils/stan')
const { dbConnections } = require('./db/connection')
const { loadMapsOnDemand } = require('./updater/shared')
const { update } = require('./updater')
const { postUpdate } = require('./postUpdate')
const { purge, prePurge, purgeByStudentNumber } = require('./updater/purge')
const { get: redisGet, set: redisSet } = require('./utils/redis')
const { logger } = require('./utils/logger')
const {
  SIS_UPDATER_SCHEDULE_CHANNEL,
  SIS_PURGE_CHANNEL,
  SIS_MISC_SCHEDULE_CHANNEL,
  NATS_GROUP,
  REDIS_TOTAL_META_KEY,
  REDIS_TOTAL_STUDENTS_KEY,
  REDIS_TOTAL_META_DONE_KEY,
  REDIS_TOTAL_STUDENTS_DONE_KEY,
  REDIS_LATEST_MESSAGE_RECEIVED,
} = require('./config')

const handleMessage = messageHandler => async msg => {
  let data = null

  try {
    data = JSON.parse(msg.getData())
  } catch (err) {
    logger.error({
      message: 'Failed to parse message',
      meta: err.stack,
    })
  }

  try {
    await messageHandler(data)

    if (data.id) {
      logger.info('Completion Ack ' + data.id + ' (Success)')
      stan.publish('SIS_COMPLETED_CHANNEL-' + data.id, JSON.stringify({ id: data.id, success: true }))
    }
  } catch (e) {
    if (data.id) {
      logger.info('Completion Ack ' + data.id + ' (Failure)')
      stan.publish(
        'SIS_COMPLETED_CHANNEL-' + data.id,
        JSON.stringify({ id: data.id, success: false, message: e.message })
      )
    }

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

const resetStatusToZero = async (...redisKeys) => {
  for (const key of redisKeys) {
    await redisSet(key, 0)
  }
}

const handleInfoMessage = async infoMsg => {
  if (infoMsg.message === 'ABORT') {
    logger.info({ message: 'Starting to abort scheduled messages' })
    await resetStatusToZero(
      REDIS_TOTAL_META_KEY,
      REDIS_TOTAL_META_DONE_KEY,
      REDIS_TOTAL_STUDENTS_KEY,
      REDIS_TOTAL_STUDENTS_DONE_KEY
    )
  }
  if (infoMsg.message === 'RELOAD_REDIS') {
    logger.info({ message: 'Starting to reload redis cache' })
    await loadMapsOnDemand()
  }
}

const isAllowedToUpdateMsg = async updateMsg => {
  const doneKey = updateMsg.type === 'students' ? REDIS_TOTAL_STUDENTS_DONE_KEY : REDIS_TOTAL_META_DONE_KEY
  const totalKey = updateMsg.type === 'students' ? REDIS_TOTAL_STUDENTS_KEY : REDIS_TOTAL_META_KEY

  const done = Number(await redisGet(doneKey))
  const totalScheduled = Number(await redisGet(totalKey))

  if (totalScheduled > done) return true
  await resetStatusToZero(doneKey, totalKey)

  return false
}

const updateMsgHandler = async updateMsg => {
  const allowedToUpdate = await isAllowedToUpdateMsg(updateMsg)
  if (!allowedToUpdate) return

  const startTime = new Date()
  await update(updateMsg)
  await postUpdate(updateMsg, startTime)
}

const purgeMsgHandler = async purgeMsg => {
  if (purgeMsg.action === 'PURGE_START') await purge(purgeMsg)
  if (purgeMsg.action === 'PREPURGE_START') await prePurge(purgeMsg)
}

const miscMsgHandler = async miscMessage => {
  const studentNumbers = miscMessage.entityIds.map(s => s.student_number)
  const msgInUpdateFormat = { ...miscMessage, entityIds: miscMessage.entityIds.map(s => s.id) }
  await purgeByStudentNumber(studentNumbers)
  await updateMsgHandler(msgInUpdateFormat)
}

stan.on('error', e => {
  logger.error({ message: 'NATS connection failed', meta: e })
  if (!process.env.CI) process.exit(1)
})

stan.on('connect', ({ clientID }) => {
  logger.info(`Connected to NATS as ${clientID}`)
  dbConnections.connect()
})

dbConnections.on('error', () => {
  logger.error('DB connections failed')
  if (!process.env.CI) process.exit(1)
})

dbConnections.on('connect', async () => {
  logger.info('DB connections established')

  const updaterChannel = stan.subscribe(SIS_UPDATER_SCHEDULE_CHANNEL, NATS_GROUP, opts)
  updaterChannel.on('message', handleMessage(updateMsgHandler))
  updaterChannel.on('error', e => {
    logger.error({ message: 'Updater channel error', meta: e.stack })
  })

  const purgeChannel = stan.subscribe(SIS_PURGE_CHANNEL, NATS_GROUP, opts)
  purgeChannel.on('message', handleMessage(purgeMsgHandler))
  purgeChannel.on('error', e => {
    logger.error({ message: 'Purge channel error', meta: e.stack })
  })

  const infoChannel = stan.subscribe('SIS_INFO_CHANNEL', NATS_GROUP, opts)
  infoChannel.on('message', handleMessage(handleInfoMessage))

  const miscChannel = stan.subscribe(SIS_MISC_SCHEDULE_CHANNEL, NATS_GROUP, opts)
  miscChannel.on('message', handleMessage(miscMsgHandler))
  miscChannel.on('error', e => {
    logger.error({ message: 'Misc channel error', meta: e.stack })
  })
})
