const { redisClient } = require('../services/redis')
const moment = require('moment')

const createRedisKeyForProductivity = id => `PRODUCTIVITY_${id}`
const createRedisKeyForThroughput = id => `THROUGHPUT_${id}`
const createRedisKeyForBasicStats = (id, yearType) => `BASIC_STATS_${id}_${yearType}`
const createRedisKeyForCreditStats = (id, yearType) => `CREDIT_STATS_${id}_${yearType}`
const createRedisKeyForGraduationStats = id => `GRADUATION_STATS_${id}`

const getProductivity = async id => {
  const redisKey = createRedisKeyForProductivity(id)
  const dataFromRedis = await redisClient.getAsync(redisKey)
  if (!dataFromRedis) return null
  return {
    [id]: JSON.parse(dataFromRedis),
  }
}

const setProductivity = async data => {
  const { id } = data
  const redisKey = createRedisKeyForProductivity(id)
  const dataToRedis = {
    ...data,
    status: 'DONE',
    lastUpdated: moment().format(),
  }
  const setOperationStatus = await redisClient.setAsync(redisKey, JSON.stringify(dataToRedis))
  if (setOperationStatus !== 'OK') return null
  return {
    [id]: dataToRedis,
  }
}

const patchProductivity = async data => {
  const { id } = data
  const redisKey = createRedisKeyForProductivity(id)
  const dataFromRedis = JSON.parse(await redisClient.getAsync(redisKey))
  const patchedData = {
    ...dataFromRedis,
    ...data,
    lastUpdated: moment().format(),
  }
  const setOperationStatus = await redisClient.setAsync(redisKey, JSON.stringify(patchedData))
  if (setOperationStatus !== 'OK') return null
  return {
    [id]: patchedData,
  }
}

const getThroughput = async id => {
  const redisKey = createRedisKeyForThroughput(id)
  const dataFromRedis = await redisClient.getAsync(redisKey)
  if (!dataFromRedis) return null
  return {
    [id]: JSON.parse(dataFromRedis),
  }
}

const setThroughput = async data => {
  const { id, data: dataToSet } = data
  const redisKey = createRedisKeyForThroughput(id)
  const dataToRedis = {
    data: dataToSet.years,
    totals: dataToSet.totals,
    stTotals: dataToSet.stTotals,
    status: 'DONE',
    lastUpdated: moment().format(),
  }
  const setOperationStatus = await redisClient.setAsync(redisKey, JSON.stringify(dataToRedis))
  if (setOperationStatus !== 'OK') return null
  return {
    [id]: dataToRedis,
  }
}

const patchThroughput = async data => {
  const [id, dataToPatch] = Object.entries(data)[0]
  const redisKey = createRedisKeyForThroughput(id)
  const { status } = dataToPatch
  const dataFromRedis = JSON.parse(await redisClient.getAsync(redisKey))
  const patchedData = {
    ...dataFromRedis,
    status,
    lastUpdated: moment().format(),
  }
  const setOperationStatus = await redisClient.setAsync(redisKey, JSON.stringify(patchedData))
  if (setOperationStatus !== 'OK') return null
  return {
    [id]: patchedData,
  }
}

const getBasicStats = async (id, yearType) => {
  const redisKey = createRedisKeyForBasicStats(id, yearType)
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

const getCreditStats = async (id, yearType) => {
  const redisKey = createRedisKeyForCreditStats(id, yearType)
  const dataFromRedis = await redisClient.getAsync(redisKey)
  if (!dataFromRedis) return null
  return JSON.parse(dataFromRedis)
}

const setCreditStats = async (data, yearType) => {
  const { id } = data
  const redisKey = createRedisKeyForCreditStats(id, yearType)
  const dataToRedis = {
    ...data,
    status: 'DONE',
    lastUpdated: moment().format(),
  }
  const setOperationStatus = await redisClient.setAsync(redisKey, JSON.stringify(dataToRedis))
  if (setOperationStatus !== 'OK') return null
  return dataToRedis
}

const getGraduationStats = async id => {
  const redisKey = createRedisKeyForGraduationStats(id)
  const dataFromRedis = await redisClient.getAsync(redisKey)
  if (!dataFromRedis) return null
  return JSON.parse(dataFromRedis)
}

const setGraduationStats = async data => {
  const { id } = data
  const redisKey = createRedisKeyForGraduationStats(id)
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
  getProductivity,
  setProductivity,
  patchProductivity,
  getThroughput,
  setThroughput,
  patchThroughput,
  getBasicStats,
  setBasicStats,
  getCreditStats,
  setCreditStats,
  getGraduationStats,
  setGraduationStats,
}
