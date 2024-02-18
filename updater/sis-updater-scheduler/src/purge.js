const { NATS_GROUP, SIS_PURGE_CHANNEL, REDIS_LAST_PREPURGE_INFO, SLACK_WEBHOOK } = require('./config')
const { logger } = require('./utils/logger')
const { stan, opts } = require('./utils/stan')
const { set: redisSet, get: redisGet } = require('./utils/redis')

const PURGE_ROWS_OLDER_THAN_DAYS = 30
const MINIMUM_DAYS_BETWEEN_PREPURGE_AND_PURGE = 4
const PREPURGE_ROWS_OLDER_THAN_DAYS = PURGE_ROWS_OLDER_THAN_DAYS - MINIMUM_DAYS_BETWEEN_PREPURGE_AND_PURGE

const TABLES_TO_PURGE = [
  'course',
  'course_providers',
  'course_types',
  'credit',
  'credit_teachers',
  'credit_types',
  'element_details',
  'organization',
  'semester_enrollments',
  'studyright',
  'studyright_elements',
  'studyright_extents',
  'teacher',
]

let collectedPrePurgeTableData = {} // Collect data from nats, since synchronous (ack) should be ok.
let stanChannel // Channel is initialized once for purge

const sendToSlack = async text => {
  logger.info('Sending to slack', { text })
  if (!SLACK_WEBHOOK) return logger.info('SLACK_WEBHOOK environment variable must be set')

  try {
    const res = await fetch(SLACK_WEBHOOK, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    })
    if (!res.ok) {
      throw new Error('Failed to send to slack')
    }
  } catch (err) {
    logger.info('Failed to send to slack', { err: err.meta })
  }
}

const sendToNats = (channel, data) =>
  new Promise((res, rej) => {
    stan.publish(channel, JSON.stringify(data), err => {
      if (err) {
        logger.error({ message: 'Failed publishing to nats', meta: err.stack })
        rej(err)
      }
      res()
    })
  })

const prePurgeGetImportantDatesFromNow = () => {
  const rowsOlderThanWillBeDeleted = new Date()
  rowsOlderThanWillBeDeleted.setDate(rowsOlderThanWillBeDeleted.getDate() - PREPURGE_ROWS_OLDER_THAN_DAYS)

  const dateAfterWhichPurgeCanBeRun = new Date()
  dateAfterWhichPurgeCanBeRun.setDate(dateAfterWhichPurgeCanBeRun.getDate() + MINIMUM_DAYS_BETWEEN_PREPURGE_AND_PURGE)

  return {
    rowsOlderThanWillBeDeleted,
    dateAfterWhichPurgeCanBeRun,
  }
}

// Set so that purge can ever delete 30 days old data

const getPrePurgeInfo = async () => {
  const infoString = await redisGet(REDIS_LAST_PREPURGE_INFO)
  const info = JSON.parse(infoString)
  return info || {}
}

const setPurgeInfo = async purgeTargetDate => {
  const purgeAfterDate = prePurgeGetImportantDatesFromNow().dateAfterWhichPurgeCanBeRun
  const info = { purgeAfterDate, purgeTargetDate }
  await redisSet(REDIS_LAST_PREPURGE_INFO, JSON.stringify(info))
}

const collectResponses = (table, count) => {
  collectedPrePurgeTableData = { ...collectedPrePurgeTableData, [table]: count }
}

const setupPurge = before => {
  const counts = Object.keys(collectedPrePurgeTableData)
    .map(table => {
      if (collectedPrePurgeTableData[table] === 0) return

      return `${collectedPrePurgeTableData[table]} rows from ${table}`
    })
    .filter(s => s)
    .join(',\n')

  const status = counts ? `${counts}\n + CASCADEs for all tables` : 'No data will be deleted.'

  const string = `Next purge after ${MINIMUM_DAYS_BETWEEN_PREPURGE_AND_PURGE}+ days will attempt to delete data older than ${before}. According to prepurge count:\n${status}`

  sendToSlack(string)

  setPurgeInfo(before)
}

const handleStatusUpdate = (table, count, before) => {
  collectResponses(table, count)
  if (TABLES_TO_PURGE.every(t => Object.keys(collectedPrePurgeTableData).includes(t))) {
    setupPurge(before)
    collectedPrePurgeTableData = {}
  }
}

const setUpResponseChannel = () => {
  if (stanChannel) return
  stanChannel = stan.subscribe(SIS_PURGE_CHANNEL, NATS_GROUP, opts)
  stanChannel.on('message', msg => {
    const { action, table, count, before } = JSON.parse(msg.getData())
    if (action !== 'PREPURGE_STATUS') return msg.ack()
    handleStatusUpdate(table, count, before)
    msg.ack()
  })
}

const startPrePurge = async () => {
  const before = prePurgeGetImportantDatesFromNow().rowsOlderThanWillBeDeleted
  setUpResponseChannel()

  await TABLES_TO_PURGE.reduce(async (prom, table) => {
    await prom
    return sendToNats(SIS_PURGE_CHANNEL, { action: 'PREPURGE_START', table, before })
  }, Promise.resolve())
}

const startPurge = async () => {
  const allowedToPurge = purgeAfterDate => {
    if (!purgeAfterDate) {
      logger.info(`Purge was scheduled, but there was no date to purge after. Purge was not executed.`)

      return false
    }
    const runPurgeAfterDate = new Date(purgeAfterDate)
    const now = new Date()

    if (now.getTime() < runPurgeAfterDate.getTime()) {
      logger.info(`Purge was scheduled, but ${runPurgeAfterDate} is after ${now}. Purge was not executed.`)
      return false
    }
    return true
  }

  const { purgeAfterDate, purgeTargetDate } = await getPrePurgeInfo()
  if (!allowedToPurge(purgeAfterDate)) return
  return TABLES_TO_PURGE.reduce(async (prom, table) => {
    await prom
    return sendToNats(SIS_PURGE_CHANNEL, { action: 'PURGE_START', table, before: purgeTargetDate })
  }, Promise.resolve())
}

module.exports = {
  startPrePurge,
  startPurge,
  sendToSlack,
}
