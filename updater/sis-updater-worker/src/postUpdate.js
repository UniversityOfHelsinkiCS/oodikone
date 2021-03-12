const { get: redisGet, incrby: redisIncrementBy, set: redisSet } = require('./utils/redis')
const { logger } = require('./utils/logger')

const {
  REDIS_TOTAL_META_KEY,
  REDIS_TOTAL_STUDENTS_KEY,
  REDIS_TOTAL_META_DONE_KEY,
  REDIS_TOTAL_STUDENTS_DONE_KEY,
} = require('./config')


const logStatus = async (type, count, done, scheduled, startTime, humanType) => {
  logger.info({
    message: `Update ${count} ${humanType}: ${done}/${scheduled}`,
    type,
    count,
    done,
    acual_scheduled: scheduled,
    timems: new Date() - startTime
  })
}

const handleUpdateEnding = async (doneKey, totalKey) => {
  await redisSet(doneKey, 0)
  await redisSet(totalKey, 0)
}

const postUpdate = async (updateMsg, currentChunkStartTime) => {
  const type = updateMsg.type === 'students' ? 'STUDENTS' : 'META'
  const count = updateMsg.entityIds.length
  const totalKey = type === 'STUDENTS' ? REDIS_TOTAL_STUDENTS_KEY : REDIS_TOTAL_META_KEY
  const doneKey = type === 'STUDENTS' ? REDIS_TOTAL_STUDENTS_DONE_KEY : REDIS_TOTAL_META_DONE_KEY

  const totalScheduled = Number(await redisGet(totalKey))
  const totalDone = Number(await redisIncrementBy(doneKey, count))

  logStatus(type, count, totalDone, totalScheduled, currentChunkStartTime, updateMsg.type)

  const updateReady = totalDone >= totalScheduled
  if (updateReady) {
    await handleUpdateEnding(doneKey, totalKey)
    logger.info('Updating ended')
    return
  }

}

module.exports = {
  postUpdate
}