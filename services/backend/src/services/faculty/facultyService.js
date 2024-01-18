const { redisClient } = require('../redis')
const moment = require('moment')
const { findFacultyProgrammeCodes } = require('./faculty')

const createRedisKeyForFacultyProgrammes = (id, programmeFilter) => `FACULTY_PROGRAMMES_${id}_${programmeFilter}`
const createRedisKeyForBasicStats = (id, yearType, programmeFilter, specialGroups) =>
  `FACULTY_BASIC_STATS_${id}_${yearType}_${programmeFilter}_${specialGroups}`
const createRedisKeyForCreditStats = (id, yearType, programmeFilter) =>
  `FACULTY_CREDIT_STATS_${id}_${yearType}_${programmeFilter}`
const createRedisKeyForThesiswriters = (id, yearType, programmeFilter, specialGroups) =>
  `FACULTY_THESIS_WRITERS_STATS_${id}_${yearType}_${programmeFilter}_${specialGroups}`
const createRedisKeyForGraduationTimeStats = (id, programmeFilter) =>
  `FACULTY_GRADUATION_TIME_STATS_${id}_${programmeFilter}`
const createRediskeyForFacultyProgress = (id, special_groups, graduated) =>
  `FACULTY_PROGRESS_STATS_${id}_${special_groups}_${graduated}`
const createRediskeyForFacultyStudents = (id, special_groups, graduated) =>
  `FACULTY_STUDENTS_STATS_${id}_${special_groups}_${graduated}`

/*
  Faculty data objects have graduation times left in as arrays, so that
  university-level evaluation overview can count median-times by itself.
  Faculties, however, don't need this, and it isn't needed in frontend
  for universityview either. This removes them from the object.
*/
const removeGraduationTimes = data => {
  Object.values(data.byGradYear.medians).forEach(array =>
    array.forEach(yearStat => {
      yearStat.times = null
    })
  )
  data.byGradYear.medians
}

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

const getProgrammes = async (code, programmeFilter) => {
  const programmes = await getFacultyProgrammesFromRedis(code, programmeFilter)
  if (programmes) return programmes
  let updatedProgrammes = await findFacultyProgrammeCodes(code, programmeFilter)
  if (updatedProgrammes) updatedProgrammes = await setFacultyProgrammes(code, updatedProgrammes, programmeFilter)

  return updatedProgrammes
}

const getFacultyProgrammesFromRedis = async (id, programmeFilter) => {
  const redisKey = createRedisKeyForFacultyProgrammes(id, programmeFilter)
  const dataFromRedis = await redisClient.getAsync(redisKey)
  if (!dataFromRedis) return null
  return JSON.parse(dataFromRedis)
}

const setBasicStats = async (data, yearType, programmeFilter, specialGroups) => {
  const { id } = data
  const redisKey = createRedisKeyForBasicStats(id, yearType, programmeFilter, specialGroups)
  const dataToRedis = {
    ...data,
    status: 'DONE',
    lastUpdated: moment().format(),
  }
  const setOperationStatus = await redisClient.setAsync(redisKey, JSON.stringify(dataToRedis))
  if (setOperationStatus !== 'OK') return null
  return dataToRedis
}

const getBasicStats = async (id, yearType, programmeFilter, specialGroups) => {
  const redisKey = createRedisKeyForBasicStats(id, yearType, programmeFilter, specialGroups)
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

const setThesisWritersStats = async (data, yearType, programmeFilter, specialGroups) => {
  const { id } = data
  const redisKey = createRedisKeyForThesiswriters(id, yearType, programmeFilter, specialGroups)
  const dataToRedis = {
    ...data,
    status: 'DONE',
    lastUpdated: moment().format(),
  }
  const setOperationStatus = await redisClient.setAsync(redisKey, JSON.stringify(dataToRedis))
  if (setOperationStatus !== 'OK') return null
  return dataToRedis
}
const getThesisWritersStats = async (id, yearType, programmeFilter, specialGroups) => {
  const redisKey = createRedisKeyForThesiswriters(id, yearType, programmeFilter, specialGroups)
  const dataFromRedis = await redisClient.getAsync(redisKey)
  if (!dataFromRedis) return null
  return JSON.parse(dataFromRedis)
}

const setGraduationStats = async (data, programmeFilter) => {
  const { id } = data
  const redisKey = createRedisKeyForGraduationTimeStats(id, programmeFilter)
  const dataToRedis = {
    ...data,
    status: 'DONE',
    lastUpdated: moment().format(),
  }
  const setOperationStatus = await redisClient.setAsync(redisKey, JSON.stringify(dataToRedis))
  if (setOperationStatus !== 'OK') return null
  return dataToRedis
}

const getGraduationStats = async (id, programmeFilter, keepGraduationTimes = false) => {
  const redisKey = createRedisKeyForGraduationTimeStats(id, programmeFilter)
  const dataFromRedis = await redisClient.getAsync(redisKey)
  if (!dataFromRedis) return null
  const data = JSON.parse(dataFromRedis)
  if (!keepGraduationTimes) {
    removeGraduationTimes(data)
  }
  return data
}

const getFacultyProgressStats = async (id, specialGroups, graduated) => {
  const redisKey = createRediskeyForFacultyProgress(id, specialGroups, graduated)
  const dataFromRedis = await redisClient.getAsync(redisKey)
  if (!dataFromRedis) return null
  return JSON.parse(dataFromRedis)
}

const setFacultyProgressStats = async (data, specialGroups, graduated) => {
  const { id } = data
  const redisKey = createRediskeyForFacultyProgress(id, specialGroups, graduated)
  const dataToRedis = {
    ...data,
    status: 'DONE',
    lastUpdated: moment().format(),
  }
  const setOperationStatus = await redisClient.setAsync(redisKey, JSON.stringify(dataToRedis))
  if (setOperationStatus !== 'OK') return null
  return dataToRedis
}

const getFacultyStudentStats = async (id, specialGroups, graduated) => {
  const redisKey = createRediskeyForFacultyStudents(id, specialGroups, graduated)
  const dataFromRedis = await redisClient.getAsync(redisKey)
  if (!dataFromRedis) return null
  return JSON.parse(dataFromRedis)
}

const setFacultyStudentStats = async (data, specialGroups, graduated) => {
  const { id } = data
  const redisKey = createRediskeyForFacultyStudents(id, specialGroups, graduated)
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
  setFacultyProgrammes,
  getProgrammes,
  setBasicStats,
  getBasicStats,
  setCreditStats,
  getCreditStats,
  setThesisWritersStats,
  getThesisWritersStats,
  setGraduationStats,
  getGraduationStats,
  getFacultyProgressStats,
  setFacultyProgressStats,
  getFacultyStudentStats,
  setFacultyStudentStats,
}
