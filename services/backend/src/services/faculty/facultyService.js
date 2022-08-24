const { redisClient } = require('../redis')
const moment = require('moment')

const createRedisKeyForFacultyProgrammes = id => `FACULTY_PROGRAMMES_${id}`
const createRedisKeyForBasicStats = (id, yearType) => `FACULTY_BASIC_STATS_${id}_${yearType}`
//const createRedisKeyForCreditStats = (id, yearType) => `FACULTY_CREDIT_STATS_${id}_${yearType}`
// const createRedisKeyForGraduationTimeStats = (id, mode, excludeOld) =>
//  `FACULTY_GRADUATION_TIME_STATS_${id}_${mode}_${excludeOld}`

const setFacultyProgrammes = async (id, data) => {
  const redisKey = createRedisKeyForFacultyProgrammes(id)
  const dataToRedis = {
    data: data,
    status: 'DONE',
    lastUpdated: moment().format(),
  }
  const setOperationStatus = await redisClient.setAsync(redisKey, JSON.stringify(dataToRedis))
  if (setOperationStatus !== 'OK') return null
  return dataToRedis
}

const getFacultyProgrammes = async id => {
  const redisKey = createRedisKeyForFacultyProgrammes(id)
  const dataFromRedis = await redisClient.getAsync(redisKey)
  if (!dataFromRedis) return null
  return JSON.parse(dataFromRedis)
}

const setBasicStats = async (data, yearType) => {
  const { id } = data
  const redisKey = createRedisKeyForBasicStats(id, yearType)
  const dataToRedis = {
    ...data,
    status: 'DONE',
    lastUpdated: moment().format(),
  }
  const setOperationStatus = await redisClient.setAsync(redisKey, JSON.stringify(dataToRedis))
  if (setOperationStatus !== 'OK') return null
  return dataToRedis
}

const getBasicStats = async (id, yearType) => {
  const redisKey = createRedisKeyForBasicStats(id, yearType)
  const dataFromRedis = await redisClient.getAsync(redisKey)
  if (!dataFromRedis) return null
  return JSON.parse(dataFromRedis)
}

module.exports = { setFacultyProgrammes, getFacultyProgrammes, setBasicStats, getBasicStats }
