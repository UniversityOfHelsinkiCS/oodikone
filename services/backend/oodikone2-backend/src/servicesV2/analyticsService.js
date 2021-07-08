const axios = require('axios')
const { redisClient } = require('./redis')
const { ANALYTICS_URL } = require('../conf-backend')
const moment = require('moment')

const client = axios.create({ baseURL: ANALYTICS_URL })

const createRedisKeyForProductivity = id => `PRODUCTIVITY_${id}`

const getProductivity = async id => {
  const redisKey = createRedisKeyForProductivity(id)
  return {
    [id]: JSON.parse(await redisClient.getAsync(redisKey))
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
  await redisClient.setAsync(redisKey, JSON.stringify(dataToRedis))
  return {
    [id]: dataToRedis
  }
}

const patchProductivity = async data => {
  const { id } = data
  const redisKey = createRedisKeyForProductivity(data.id)
  const dataFromRedis = await redisClient.getAsync(redisKey)
  const patchedData = {
    ...dataFromRedis,
    ...data,
    lastUpdated: moment().format()
  }
  await redisClient.setAsync(redisKey, JSON.stringify(patchedData))
  return {
    [id]: patchedData
  }
}

const getThroughput = async id => {
  const response = await client.get(`/v2/throughput/${id}`)
  return response.data
}

const setThroughput = async data => {
  const response = await client.post('/v2/throughput', { data })
  return response.data
}

const patchThroughput = async data => {
  const response = await client.patch('/v2/throughput', { data })
  return response.data
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
