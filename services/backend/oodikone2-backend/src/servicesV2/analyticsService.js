const axios = require('axios')
const { redisClient } = require('./redis')
const { ANALYTICS_URL } = require('../conf-backend')
const moment = require('moment')

const client = axios.create({ baseURL: ANALYTICS_URL })

const createRedisKeyForProductivity = id => `PRODUCTIVITY_${id}`
const createRedisKeyForThroughput = id => `THROUGHPUT_${id}`

const getProductivity = async id => {
  const redisKey = createRedisKeyForProductivity(id)
  const dataFromRedis = await redisClient.getAsync(redisKey)
  if (!dataFromRedis) return null
  return {
    [id]: JSON.parse(dataFromRedis)
  }
}

const setProductivity = async data => {
  const { id } = data
  const redisKey = createRedisKeyForProductivity(id)
  const dataToRedis = {
    ...data,
    status: 'DONE',
    lastUpdated: moment().format()
  }
  const setOperationStatus = await redisClient.setAsync(redisKey, JSON.stringify(dataToRedis))
  if (setOperationStatus !== 'OK') return null
  return {
    [id]: dataToRedis
  }
}

const patchProductivity = async data => {
  const { id } = data
  const redisKey = createRedisKeyForProductivity(id)
  const dataFromRedis = JSON.parse(await redisClient.getAsync(redisKey))
  const patchedData = {
    ...dataFromRedis,
    ...data,
    lastUpdated: moment().format()
  }
  const setOperationStatus = await redisClient.setAsync(redisKey, JSON.stringify(patchedData))
  if (setOperationStatus !== 'OK') return null
  return {
    [id]: patchedData
  }
}

const getThroughput = async id => {
  const redisKey = createRedisKeyForThroughput(id)
  const dataFromRedis = await redisClient.getAsync(redisKey)
  if (!dataFromRedis) return null
  return {
    [id]: JSON.parse(dataFromRedis)
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
    lastUpdated: moment().format()
  }
  const setOperationStatus = await redisClient.setAsync(redisKey, JSON.stringify(dataToRedis))
  if (setOperationStatus !== 'OK') return null
  return {
    [id]: dataToRedis
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
    lastUpdated: moment().format()
  }
  const setOperationStatus = await redisClient.setAsync(redisKey, JSON.stringify(patchedData))
  if (setOperationStatus !== 'OK') return null
  return {
    [id]: patchedData
  }
}

const patchFacultyYearlyStats = async data => {
  const response = await client.patch('/facultystats', { data })
  return response.data
}

const getFacultyYearlyStats = async data => {
  const response = await client.get('/facultystats', { data })
  return response.data
}

const patchNonGraduatedStudents = async data => {
  const response = await client.patch('/v2/nongraduatedstudents', { data })
  return response.data
}

const getNonGraduatedStudents = async id => {
  const response = await client.get(`/v2/nongraduatedstudents/${id}`)
  return response.data
}

module.exports = {
  getProductivity,
  setProductivity,
  patchProductivity,
  getThroughput,
  setThroughput,
  patchThroughput,
  patchFacultyYearlyStats,
  getFacultyYearlyStats,
  patchNonGraduatedStudents,
  getNonGraduatedStudents
}
