const { redisClient } = require('../services/redis')
const moment = require('moment')

// Only new bachelor, masters and doctoral programmes get their data updated in redis every night, use redis for them
const isUpdatedNewProgramme = code => code.includes('KH') || code.includes('MH') || /^(T)[0-9]{6}$/.test(code)
const createRedisKeyForBasicStats = (id, yearType, specialGroups) => `BASIC_STATS_${id}_${yearType}_${specialGroups}`
const createRedisKeyForCreditStats = (id, yearType, specialGroups) => `CREDIT_STATS_${id}_${yearType}_${specialGroups}`
const createRedisKeyForGraduationStats = (id, yearType, specialGroups) =>
  `GRADUATION_STATS_${id}_${yearType}_${specialGroups}`
const createRedisKeyForStudytrackStats = (id, graduated, specialGroups) =>
  `STUDYTRACK_STATS_${id}_${graduated}_${specialGroups}`

const getBasicStats = async (id, combinedProgramme, yearType, specialGroups) => {
  if (!isUpdatedNewProgramme(id)) return null
  let searchkey = combinedProgramme ? `${id}-${combinedProgramme}` : id
  const redisKey = createRedisKeyForBasicStats(searchkey, yearType, specialGroups)
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
  if (!isUpdatedNewProgramme(id)) return dataToRedis
  const setOperationStatus = await redisClient.setAsync(redisKey, JSON.stringify(dataToRedis))
  if (setOperationStatus !== 'OK') return null
  return dataToRedis
}

const getCreditStats = async (id, isAcademicYear, specialGroups) => {
  if (!isUpdatedNewProgramme(id)) return null
  const redisKey = createRedisKeyForCreditStats(id, isAcademicYear ? 'ACADEMIC_YEAR' : 'CALENDAR_YEAR', specialGroups)
  const dataFromRedis = await redisClient.getAsync(redisKey)
  if (!dataFromRedis) return null
  return JSON.parse(dataFromRedis)
}

const setCreditStats = async (data, isAcademicYear, specialGroups) => {
  const { id } = data
  const redisKey = createRedisKeyForCreditStats(
    id,
    isAcademicYear ? 'ACADEMIC_YEAR' : 'CALENDAR_YEAR',
    specialGroups ? 'SPECIAL_INCLUDED' : 'SPECIAL_EXCLUDED'
  )
  const dataToRedis = {
    ...data,
    status: 'DONE',
    lastUpdated: moment().format(),
  }
  if (!isUpdatedNewProgramme(id)) return dataToRedis
  const setOperationStatus = await redisClient.setAsync(redisKey, JSON.stringify(dataToRedis))
  if (setOperationStatus !== 'OK') return null
  return dataToRedis
}

const getGraduationStats = async (id, combinedProgramme, yearType, specialGroups) => {
  if (!isUpdatedNewProgramme(id)) return null
  let searchkey = combinedProgramme ? `${id}-${combinedProgramme}` : id
  const redisKey = createRedisKeyForGraduationStats(searchkey, yearType, specialGroups)
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
  if (!isUpdatedNewProgramme(id)) return dataToRedis
  const setOperationStatus = await redisClient.setAsync(redisKey, JSON.stringify(dataToRedis))
  if (setOperationStatus !== 'OK') return null
  return dataToRedis
}

const getStudytrackStats = async (id, combinedProgramme, graduated, specialGroups) => {
  if (!isUpdatedNewProgramme(id)) return null
  let searchkey = combinedProgramme ? `${id}-${combinedProgramme}` : id
  const redisKey = createRedisKeyForStudytrackStats(searchkey, graduated, specialGroups)
  const dataFromRedis = await redisClient.getAsync(redisKey)
  if (!dataFromRedis) return null
  return JSON.parse(dataFromRedis)
}

const setStudytrackStats = async (data, graduated, specialGroups) => {
  const { id } = data
  const redisKey = createRedisKeyForStudytrackStats(id, graduated, specialGroups)
  const dataToRedis = {
    ...data,
    status: 'DONE',
    lastUpdated: moment().format(),
  }
  if (!isUpdatedNewProgramme(id)) return dataToRedis
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
