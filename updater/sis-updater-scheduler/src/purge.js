const { NATS_GROUP, SIS_PURGE_CHANNEL, REDIS_LAST_PREPURGE_INFO } = require('./config')
const { logger } = require('./utils/logger')
const { stan, opts } = require('./utils/stan')
const { set: redisSet, get: redisGet } = require('./utils/redis')

const MINIMUM_DAYS_BETWEEN_PREPURGE_AND_PURGE = 5

const sendToSlack = (message) => {
  logger.info(message)
  console.log(sendToSlack)
}

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
  'teacher'
]

let collectedPrePurgeTableData = {}
let stanChannel

const getPrePurgeInfo = async () => {
  const infoString = await redisGet(REDIS_LAST_PREPURGE_INFO)
  return JSON.parse(infoString)
}

const setPrePurgeInfo = async (prePurgeDate, prePurgeTargetDate) => {
  const info = { prePurgeDate, prePurgeTargetDate }
  await redisSet(REDIS_LAST_PREPURGE_INFO, JSON.stringify(info))
}

const sendToNats = (channel, data) => new Promise((res, rej) => {
  stan.publish(channel, JSON.stringify(data), err => {
    if (err) {
      console.log('failed publishing', err)
      rej(err)
    }
    res()
  })
})

const collectResponses = (table, count) => {
  collectedPrePurgeTableData = { ...collectedPrePurgeTableData, [table]: count }
}

const setupPurge = (before) => {
  const now = new Date()

  const status = Object.keys(collectedPrePurgeTableData).map(table =>
    `From table ${table}, ${collectedPrePurgeTableData[table]} records will be deleted`).join(',\n')

  sendToSlack(`Prepurge has been run now, next purge after ${MINIMUM_DAYS_BETWEEN_PREPURGE_AND_PURGE} will delete the data.\n${status}`)

  setPrePurgeInfo(now, before)
}

const setUpResponseChannel = () => {
  if (stanChannel) return
  stanChannel = stan.subscribe(SIS_PURGE_CHANNEL, NATS_GROUP, opts)
  stanChannel.on('message', msg => {
    const data = msg.getData()

    if (data.success) collectResponses(data.table, data.count)

    if (TABLES_TO_PURGE.every(table => Object.keys(collectedPrePurgeTableData).includes(table))) {
      collectedPrePurgeTableData = {}
      setupPurge(data.before)
    }

    msg.ack()
  })

}

/**
 * purge happens the on sunday
 * prePurge happens the previous monday (- 6 days)
 */
const getPrePurgeBefore = () => {
  const PURGE_LIMIT = 31
  const EXPECTED_PREPURGE_PURGE_DIFF = 6
  const prePurgeBefore = new Date()
  prePurgeBefore.setDate(prePurgeBefore.getDate() - (PURGE_LIMIT - EXPECTED_PREPURGE_PURGE_DIFF))
  return prePurgeBefore
}

const startPrePurge = async () => {
  const before = getPrePurgeBefore()
  setUpResponseChannel()
  await TABLES_TO_PURGE.reduce(async (prom, table) => {
    await prom
    return sendToNats(SIS_PURGE_CHANNEL, { action: 'PREPURGE', table, before })
  })

  return false
}

const allowedToPurge = async () => {
  const now = new Date()
  const { prePurgeDate } = await getPrePurgeInfo()
  const msDiff = now.getTime() - prePurgeDate.getTime()
  const dayDiff = msDiff / (1000 * 60 * 60 * 24)
  if (dayDiff > MINIMUM_DAYS_BETWEEN_PREPURGE_AND_PURGE) return true

  return false
}

const startPurge = async () => {
  if (!(await allowedToPurge())) return
  const { prePurgeTargetDate } = await getPrePurgeInfo()
  return TABLES_TO_PURGE.reduce(async (prom, table) => {
    await prom
    return sendToNats(SIS_PURGE_CHANNEL, { action: 'PURGE', table, before: prePurgeTargetDate })
  })
}

module.exports = {
  startPrePurge,
  startPurge
}