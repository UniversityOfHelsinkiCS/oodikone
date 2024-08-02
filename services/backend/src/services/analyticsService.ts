import moment from 'moment'
import { facultyCodes, ignoredFacultyCodes } from '../config/organizationConstants'
import { redisClient } from './redis'

// Only new bachelor, masters and doctoral programmes get their data updated in redis every night, use redis for them
const isUpdatedNewProgramme = (code: string) => code.includes('KH') || code.includes('MH') || /^(T)[0-9]{6}$/.test(code)
const filteredFacultyCodes = facultyCodes.filter(item => !ignoredFacultyCodes.includes(item))
const isFaculty = (code: string) => filteredFacultyCodes.includes(code)

const createRedisKeyForBasicStats = (id: string, yearType: string, specialGroups: string) => {
  return `BASIC_STATS_${id}_${yearType}_${specialGroups}`
}
const createRedisKeyForCreditStats = (id: string, yearType: string, specialGroups: string) => {
  return `CREDIT_STATS_${id}_${yearType}_${specialGroups}`
}
const createRedisKeyForGraduationStats = (id: string, yearType: string, specialGroups: string) => {
  return `GRADUATION_STATS_${id}_${yearType}_${specialGroups}`
}
const createRedisKeyForStudytrackStats = (id: string, graduated: string, specialGroups: string) => {
  return `STUDYTRACK_STATS_${id}_${graduated}_${specialGroups}`
}

export const getBasicStats = async (
  id: string,
  combinedProgramme: string | null,
  yearType: string,
  specialGroups: string
) => {
  if (!isUpdatedNewProgramme(id)) {
    return null
  }
  const searchkey = combinedProgramme ? `${id}-${combinedProgramme}` : id
  const redisKey = createRedisKeyForBasicStats(searchkey, yearType, specialGroups)
  const dataFromRedis = await redisClient.getAsync(redisKey)
  if (!dataFromRedis) {
    return null
  }
  return JSON.parse(dataFromRedis)
}

export const setBasicStats = async (data, yearType: string, specialGroups: string) => {
  const { id } = data
  const redisKey = createRedisKeyForBasicStats(id, yearType, specialGroups)
  const dataToRedis = {
    ...data,
    status: 'DONE',
    lastUpdated: moment().format(),
  }
  if (!isUpdatedNewProgramme(id)) {
    return dataToRedis
  }
  const setOperationStatus = await redisClient.setAsync(redisKey, JSON.stringify(dataToRedis))
  if (setOperationStatus !== 'OK') {
    return null
  }
  return dataToRedis
}

export const getCreditStats = async (providerCode: string, isAcademicYear: boolean, specialGroups: boolean) => {
  const redisKey = createRedisKeyForCreditStats(
    providerCode,
    isAcademicYear ? 'ACADEMIC_YEAR' : 'CALENDAR_YEAR',
    specialGroups ? 'SPECIAL_INCLUDED' : 'SPECIAL_EXCLUDED'
  )
  const dataFromRedis = await redisClient.getAsync(redisKey)
  if (!dataFromRedis) {
    return null
  }
  return JSON.parse(dataFromRedis)
}

export const setCreditStats = async (data, isAcademicYear: boolean, specialGroups: boolean) => {
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
  if (!isUpdatedNewProgramme(data.id) && !isFaculty(data.id)) {
    return dataToRedis
  }
  const setOperationStatus = await redisClient.setAsync(redisKey, JSON.stringify(dataToRedis))
  if (setOperationStatus !== 'OK') {
    return null
  }
  return dataToRedis
}

export const getGraduationStats = async (
  id: string,
  combinedProgramme: string | null,
  yearType: string,
  specialGroups: string
) => {
  if (!isUpdatedNewProgramme(id)) {
    return null
  }
  const searchkey = combinedProgramme ? `${id}-${combinedProgramme}` : id
  const redisKey = createRedisKeyForGraduationStats(searchkey, yearType, specialGroups)
  const dataFromRedis = await redisClient.getAsync(redisKey)
  if (!dataFromRedis) {
    return null
  }
  return JSON.parse(dataFromRedis)
}

export const setGraduationStats = async (data, yearType: string, specialGroups: string) => {
  const { id } = data
  const redisKey = createRedisKeyForGraduationStats(id, yearType, specialGroups)
  const dataToRedis = {
    ...data,
    status: 'DONE',
    lastUpdated: moment().format(),
  }
  if (!isUpdatedNewProgramme(id)) {
    return dataToRedis
  }
  const setOperationStatus = await redisClient.setAsync(redisKey, JSON.stringify(dataToRedis))
  if (setOperationStatus !== 'OK') {
    return null
  }
  return dataToRedis
}

export const getStudytrackStats = async (
  id: string,
  combinedProgramme: string | null,
  graduated: string,
  specialGroups: string
) => {
  if (!isUpdatedNewProgramme(id)) {
    return null
  }
  const searchkey = combinedProgramme ? `${id}-${combinedProgramme}` : id
  const redisKey = createRedisKeyForStudytrackStats(searchkey, graduated, specialGroups)
  const dataFromRedis = await redisClient.getAsync(redisKey)
  if (!dataFromRedis) {
    return null
  }
  return JSON.parse(dataFromRedis)
}

export const setStudytrackStats = async (data, graduated: string, specialGroups: string) => {
  const { id } = data
  const redisKey = createRedisKeyForStudytrackStats(id, graduated, specialGroups)
  const dataToRedis = {
    ...data,
    status: 'DONE',
    lastUpdated: moment().format(),
  }
  if (!isUpdatedNewProgramme(id)) {
    return dataToRedis
  }
  const setOperationStatus = await redisClient.setAsync(redisKey, JSON.stringify(dataToRedis))
  if (setOperationStatus !== 'OK') {
    return null
  }
  return dataToRedis
}
