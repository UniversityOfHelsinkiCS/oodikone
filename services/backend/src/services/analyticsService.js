const { redisClient } = require('../services/redis')
const moment = require('moment')

const createRedisKeyForBasicStats = (id, yearType, specialGroups) => `BASIC_STATS_${id}_${yearType}_${specialGroups}`
const createRedisKeyForCreditStats = (id, yearType, specialGroups) => `CREDIT_STATS_${id}_${yearType}_${specialGroups}`
const createRedisKeyForGraduationStats = (id, yearType, specialGroups) =>
  `GRADUATION_STATS_${id}_${yearType}_${specialGroups}`
const createRedisKeyForStudytrackStats = (id, graduated, specialGroups, yearsCombined) =>
  `STUDYTRACK_STATS_${id}_${graduated}_${specialGroups}_${yearsCombined}`

const getBasicStats = async (id, yearType, specialGroups) => {
  const redisKey = createRedisKeyForBasicStats(id, yearType, specialGroups)
  const dataFromRedis = await redisClient.getAsync(redisKey)
  if (!dataFromRedis) return null
  return JSON.parse(dataFromRedis)
}

const setBasicStats = async (data, yearType, specialGroups) => {
  const { id } = data
  const redisKey = createRedisKeyForBasicStats(id, yearType, specialGroups)
  const dataToRedis = {
    ...data,
    status: 'DONE',
    lastUpdated: moment().format(),
  }
  const setOperationStatus = await redisClient.setAsync(redisKey, JSON.stringify(dataToRedis))
  if (setOperationStatus !== 'OK') return null
  return dataToRedis
}

const getCreditStats = async (id, yearType, specialGroups) => {
  const redisKey = createRedisKeyForCreditStats(id, yearType, specialGroups)
  const dataFromRedis = await redisClient.getAsync(redisKey)
  if (!dataFromRedis) return null
  return JSON.parse(dataFromRedis)
}

const setCreditStats = async (data, yearType, specialGroups) => {
  const { id } = data
  const redisKey = createRedisKeyForCreditStats(id, yearType, specialGroups)
  const dataToRedis = {
    ...data,
    status: 'DONE',
    lastUpdated: moment().format(),
  }
  const setOperationStatus = await redisClient.setAsync(redisKey, JSON.stringify(dataToRedis))
  if (setOperationStatus !== 'OK') return null
  return dataToRedis
}

const getGraduationStats = async (id, yearType, specialGroups) => {
  const redisKey = createRedisKeyForGraduationStats(id, yearType, specialGroups)
  const dataFromRedis = await redisClient.getAsync(redisKey)
  if (!dataFromRedis) return null
  return JSON.parse(dataFromRedis)
}

const setGraduationStats = async (data, yearType, specialGroups) => {
  const { id } = data
  const redisKey = createRedisKeyForGraduationStats(id, yearType, specialGroups)
  const dataToRedis = {
    ...data,
    status: 'DONE',
    lastUpdated: moment().format(),
  }
  const setOperationStatus = await redisClient.setAsync(redisKey, JSON.stringify(dataToRedis))
  if (setOperationStatus !== 'OK') return null
  return dataToRedis
}

const getStudytrackStats = async (id, graduated, specialGroups, yearsCombined) => {
  const redisKey = createRedisKeyForStudytrackStats(id, graduated, specialGroups, yearsCombined)
  const dataFromRedis = await redisClient.getAsync(redisKey)
  if (!dataFromRedis) return null
  return JSON.parse(dataFromRedis)
}

const setStudytrackStats = async (data, graduated, specialGroups, yearsCombined) => {
  const { id } = data
  const redisKey = createRedisKeyForStudytrackStats(id, graduated, specialGroups, yearsCombined)
  const dataToRedis = {
    ...data,
    status: 'DONE',
    lastUpdated: moment().format(),
  }
  const setOperationStatus = await redisClient.setAsync(redisKey, JSON.stringify(dataToRedis))
  if (setOperationStatus !== 'OK') return null
  return dataToRedis
}

module.exports = {
  getBasicStats,
  setBasicStats,
  getCreditStats,
  setCreditStats,
  getGraduationStats,
  setGraduationStats,
  getStudytrackStats,
  setStudytrackStats,
}
