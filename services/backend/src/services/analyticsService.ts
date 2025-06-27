import { Graduated, SpecialGroups, YearType } from '@oodikone/shared/types'
import { facultyCodes, ignoredFacultyCodes } from '../config/organizationConstants'
import { redisClient } from './redis'
import { isRelevantProgramme } from './studyProgramme/studyProgrammeHelpers'

const filteredFacultyCodes = facultyCodes.filter(item => !ignoredFacultyCodes.includes(item))
const isFaculty = (code: string) => filteredFacultyCodes.includes(code)

const createRedisKeyForBasicStats = (id: string, yearType: YearType, specialGroups: SpecialGroups) => {
  return `BASIC_STATS_${id}_${yearType}_${specialGroups}`
}
const createRedisKeyForCreditStats = (id: string, yearType: YearType, specialGroups: SpecialGroups) => {
  return `CREDIT_STATS_${id}_${yearType}_${specialGroups}`
}
const createRedisKeyForGraduationStats = (id: string, yearType: YearType, specialGroups: SpecialGroups) => {
  return `GRADUATION_STATS_${id}_${yearType}_${specialGroups}`
}
const createRedisKeyForStudyTrackStats = (id: string, graduated: Graduated, specialGroups: SpecialGroups) => {
  return `STUDYTRACK_STATS_${id}_${graduated}_${specialGroups}`
}

const shouldSaveToRedis = (id: unknown) => {
  if (typeof id !== 'string') return false
  if (isRelevantProgramme(id)) return true
  const splitId = id.split('-')
  return splitId.length === 2 && isRelevantProgramme(splitId[0]) && isRelevantProgramme(splitId[1])
}

export const getBasicStats = async (
  id: string,
  combinedProgramme: string | null,
  yearType: YearType,
  specialGroups: SpecialGroups
) => {
  const searchKey = combinedProgramme ? `${id}-${combinedProgramme}` : id
  const redisKey = createRedisKeyForBasicStats(searchKey, yearType, specialGroups)
  const dataFromRedis = await redisClient.get(redisKey)
  if (!dataFromRedis) {
    return null
  }
  return JSON.parse(dataFromRedis)
}

export const setBasicStats = async (data, yearType: YearType, specialGroups: SpecialGroups) => {
  const { id } = data
  const redisKey = createRedisKeyForBasicStats(id, yearType, specialGroups)
  const dataToRedis = {
    ...data,
    status: 'DONE',
    lastUpdated: new Date().toISOString(),
  }
  if (!shouldSaveToRedis(id)) {
    return dataToRedis
  }
  const setOperationStatus = await redisClient.set(redisKey, JSON.stringify(dataToRedis))
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
  const dataFromRedis = await redisClient.get(redisKey)
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
    lastUpdated: new Date().toISOString(),
  }
  if (!isRelevantProgramme(id) && !isFaculty(id)) {
    return dataToRedis
  }
  const setOperationStatus = await redisClient.set(redisKey, JSON.stringify(dataToRedis))
  if (setOperationStatus !== 'OK') {
    return null
  }
  return dataToRedis
}

export const getGraduationStats = async (
  id: string,
  combinedProgramme: string | null,
  yearType: YearType,
  specialGroups: SpecialGroups
) => {
  const searchKey = combinedProgramme ? `${id}-${combinedProgramme}` : id
  const redisKey = createRedisKeyForGraduationStats(searchKey, yearType, specialGroups)
  const dataFromRedis = await redisClient.get(redisKey)
  if (!dataFromRedis) {
    return null
  }
  return JSON.parse(dataFromRedis)
}

export const setGraduationStats = async (data, yearType: YearType, specialGroups: SpecialGroups) => {
  const { id } = data
  const redisKey = createRedisKeyForGraduationStats(id, yearType, specialGroups)
  const dataToRedis = {
    ...data,
    status: 'DONE',
    lastUpdated: new Date().toISOString(),
  }
  if (!shouldSaveToRedis(id)) {
    return dataToRedis
  }
  const setOperationStatus = await redisClient.set(redisKey, JSON.stringify(dataToRedis))
  if (setOperationStatus !== 'OK') {
    return null
  }
  return dataToRedis
}

export const getStudyTrackStats = async (
  id: string,
  combinedProgramme: string | null,
  graduated: Graduated,
  specialGroups: SpecialGroups
) => {
  const searchKey = combinedProgramme ? `${id}-${combinedProgramme}` : id
  const redisKey = createRedisKeyForStudyTrackStats(searchKey, graduated, specialGroups)
  const dataFromRedis = await redisClient.get(redisKey)
  if (!dataFromRedis) {
    return null
  }
  return JSON.parse(dataFromRedis)
}

export const setStudyTrackStats = async (data, graduated: Graduated, specialGroups: SpecialGroups) => {
  const { id } = data
  const redisKey = createRedisKeyForStudyTrackStats(id, graduated, specialGroups)
  const dataToRedis = {
    ...data,
    status: 'DONE',
    lastUpdated: new Date().toISOString(),
  }
  if (!shouldSaveToRedis(id)) {
    return dataToRedis
  }
  const setOperationStatus = await redisClient.set(redisKey, JSON.stringify(dataToRedis))
  if (setOperationStatus !== 'OK') {
    return null
  }
  return dataToRedis
}
