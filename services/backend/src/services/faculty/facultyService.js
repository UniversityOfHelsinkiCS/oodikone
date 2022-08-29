const { redisClient } = require('../redis')
const moment = require('moment')

const createRedisKeyForFacultyProgrammes = (id, programmeFilter) => `FACULTY_PROGRAMMES_${id}_${programmeFilter}`
const createRedisKeyForBasicStats = (id, yearType, programmeFilter) =>
  `FACULTY_BASIC_STATS_${id}_${yearType}_${programmeFilter}`
const createRedisKeyForCreditStats = (id, yearType, programmeFilter) =>
  `FACULTY_CREDIT_STATS_${id}_${yearType}_${programmeFilter}`
// const createRedisKeyForGraduationTimeStats = (id, mode, programmeFilter) =>
//  `FACULTY_GRADUATION_TIME_STATS_${id}_${mode}__${programmeFilter}`
const createRedisKeyForThesiswriters = (id, yearType, programmeFilter) =>
  `FACULTY_THESIS_WRITERS_STATS_${id}_${yearType}_${programmeFilter}`

const setFacultyProgrammes = async (id, data, programmeFilter) => {
  const redisKey = createRedisKeyForFacultyProgrammes(id, programmeFilter)
  const dataToRedis = {
    data: data,
    status: 'DONE',
    lastUpdated: moment().format(),
  }
  const setOperationStatus = await redisClient.setAsync(redisKey, JSON.stringify(dataToRedis))
  if (setOperationStatus !== 'OK') return null
  return dataToRedis
}

const getFacultyProgrammes = async (id, programmeFilter) => {
  const redisKey = createRedisKeyForFacultyProgrammes(id, programmeFilter)
  const dataFromRedis = await redisClient.getAsync(redisKey)
  if (!dataFromRedis) return null
  return JSON.parse(dataFromRedis)
}

const setBasicStats = async (data, yearType, programmeFilter) => {
  const { id } = data
  const redisKey = createRedisKeyForBasicStats(id, yearType, programmeFilter)
  const dataToRedis = {
    ...data,
    status: 'DONE',
    lastUpdated: moment().format(),
  }
  const setOperationStatus = await redisClient.setAsync(redisKey, JSON.stringify(dataToRedis))
  if (setOperationStatus !== 'OK') return null
  return dataToRedis
}

const getBasicStats = async (id, yearType, programmeFilter) => {
  const redisKey = createRedisKeyForBasicStats(id, yearType, programmeFilter)
  const dataFromRedis = await redisClient.getAsync(redisKey)
  if (!dataFromRedis) return null
  return JSON.parse(dataFromRedis)
}

const setCreditStats = async (data, yearType, programmeFilter) => {
  const { id } = data
  const redisKey = createRedisKeyForCreditStats(id, yearType, programmeFilter)
  const dataToRedis = {
    ...data,
    status: 'DONE',
    lastUpdated: moment().format(),
  }
  const setOperationStatus = await redisClient.setAsync(redisKey, JSON.stringify(dataToRedis))
  if (setOperationStatus !== 'OK') return null
  return dataToRedis
}

const getCreditStats = async (id, yearType, programmeFilter) => {
  const redisKey = createRedisKeyForCreditStats(id, yearType, programmeFilter)
  const dataFromRedis = await redisClient.getAsync(redisKey)
  if (!dataFromRedis) return null
  return JSON.parse(dataFromRedis)
}

const setThesisWritersStats = async (data, yearType, programmeFilter) => {
  const { id } = data
  const redisKey = createRedisKeyForThesiswriters(id, yearType, programmeFilter)
  const dataToRedis = {
    ...data,
    status: 'DONE',
    lastUpdated: moment().format(),
  }
  const setOperationStatus = await redisClient.setAsync(redisKey, JSON.stringify(dataToRedis))
  if (setOperationStatus !== 'OK') return null
  return dataToRedis
}
const getThesisWritersStats = async (id, yearType, programmeFilter) => {
  const redisKey = createRedisKeyForThesiswriters(id, yearType, programmeFilter)
  const dataFromRedis = await redisClient.getAsync(redisKey)
  if (!dataFromRedis) return null
  return JSON.parse(dataFromRedis)
}

module.exports = {
  setFacultyProgrammes,
  getFacultyProgrammes,
  setBasicStats,
  getBasicStats,
  setCreditStats,
  getCreditStats,
  setThesisWritersStats,
  getThesisWritersStats,
}
