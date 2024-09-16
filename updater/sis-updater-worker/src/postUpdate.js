const { intersection } = require('lodash')

const {
  REDIS_TOTAL_META_KEY,
  REDIS_TOTAL_STUDENTS_KEY,
  REDIS_TOTAL_META_DONE_KEY,
  REDIS_TOTAL_STUDENTS_DONE_KEY,
} = require('./config')
const {
  fixVarhaiskasvatusStudyRights,
  studentsThatNeedToBeFixed,
} = require('./updater/updateStudents/varhaiskasvatusFixer')
const { logger } = require('./utils/logger')
const { redisClient } = require('./utils/redis')

const logStatus = async (type, count, done, scheduled, startTime, humanType) => {
  logger.info({
    message: `Updated ${count} ${humanType}: ${done}/${scheduled}`,
    type,
    count,
    done,
    acual_scheduled: scheduled,
    timems: new Date() - startTime,
  })
}

const handleUpdateEnding = async (doneKey, totalKey) => {
  await redisClient.set(doneKey, 0)
  await redisClient.set(totalKey, 0)
}

const postUpdate = async (updateMsg, currentChunkStartTime) => {
  if (!updateMsg.entityIds) {
    return
  }

  const studentsToBeFixed = intersection(
    updateMsg.entityIds || [],
    studentsThatNeedToBeFixed.map(s => s.id)
  )
  if (studentsToBeFixed.length > 0) {
    await fixVarhaiskasvatusStudyRights(studentsToBeFixed)
  }

  const type = updateMsg.type === 'students' ? 'STUDENTS' : 'META'
  const count = updateMsg.entityIds.length
  const totalKey = type === 'STUDENTS' ? REDIS_TOTAL_STUDENTS_KEY : REDIS_TOTAL_META_KEY
  const doneKey = type === 'STUDENTS' ? REDIS_TOTAL_STUDENTS_DONE_KEY : REDIS_TOTAL_META_DONE_KEY

  const totalScheduled = Number(await redisClient.get(totalKey))
  const totalDone = await redisClient.incrBy(doneKey, count)

  logStatus(type, count, totalDone, totalScheduled, currentChunkStartTime, updateMsg.type)

  const updateReady = totalDone >= totalScheduled
  if (updateReady) {
    await handleUpdateEnding(doneKey, totalKey)
    logger.info('Updating ended')
  }
}

module.exports = {
  postUpdate,
}
