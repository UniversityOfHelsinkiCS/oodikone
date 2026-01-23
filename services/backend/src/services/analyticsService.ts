import { SpecialGroups, StudyTrackStats, YearType } from '@oodikone/shared/types'
import { BasicStats, CreditStats, ProgrammeGraduationStats } from '@oodikone/shared/types/studyProgramme'
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
const createRedisKeyForStudyTrackStats = (id: string, specialGroups: SpecialGroups) => {
  return `STUDYTRACK_STATS_${id}_${specialGroups}`
}

// *Should* always be a string (previously unknown)
const shouldSaveToRedis = (id: string) => {
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
): Promise<BasicStats | null> => {
  const searchKey = combinedProgramme ? `${id}-${combinedProgramme}` : id
  const redisKey = createRedisKeyForBasicStats(searchKey, yearType, specialGroups)
  const dataFromRedis = await redisClient.get(redisKey)
  if (!dataFromRedis) {
    return null
  }
  return JSON.parse(dataFromRedis)
}

export const setBasicStats = async (data: BasicStats, yearType: YearType, specialGroups: SpecialGroups) => {
  const { id } = data
  if (!shouldSaveToRedis(id)) {
    return
  }
  const redisKey = createRedisKeyForBasicStats(id, yearType, specialGroups)
  await redisClient.set(redisKey, JSON.stringify(data))
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
  return JSON.parse(dataFromRedis) as CreditStats
}

export const setCreditStats = async (data: CreditStats, isAcademicYear: boolean, specialGroups: boolean) => {
  const { id } = data
  const redisKey = createRedisKeyForCreditStats(
    id,
    isAcademicYear ? 'ACADEMIC_YEAR' : 'CALENDAR_YEAR',
    specialGroups ? 'SPECIAL_INCLUDED' : 'SPECIAL_EXCLUDED'
  )
  if (!isRelevantProgramme(id) && !isFaculty(id)) {
    return
  }
  await redisClient.set(redisKey, JSON.stringify(data))
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
  return JSON.parse(dataFromRedis) as ProgrammeGraduationStats
}

export const setGraduationStats = async (data, yearType: YearType, specialGroups: SpecialGroups) => {
  const { id } = data
  if (!shouldSaveToRedis(id)) {
    return
  }
  const redisKey = createRedisKeyForGraduationStats(id, yearType, specialGroups)
  await redisClient.set(redisKey, JSON.stringify(data))
}

export const getStudyTrackStats = async (
  id: string,
  combinedProgramme: string | null,
  specialGroups: SpecialGroups
) => {
  const searchKey = combinedProgramme ? `${id}-${combinedProgramme}` : id
  const redisKey = createRedisKeyForStudyTrackStats(searchKey, specialGroups)
  const dataFromRedis = await redisClient.get(redisKey)
  if (!dataFromRedis) {
    return null
  }
  return JSON.parse(dataFromRedis) as StudyTrackStats
}

export const setStudyTrackStats = async (data: StudyTrackStats, specialGroups: SpecialGroups) => {
  const { id } = data
  if (!shouldSaveToRedis(id)) {
    return
  }
  const redisKey = createRedisKeyForStudyTrackStats(id, specialGroups)
  await redisClient.set(redisKey, JSON.stringify(data))
}
