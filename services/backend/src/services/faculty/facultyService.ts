import moment from 'moment'

import { Name } from '../../types'
import { redisClient } from '../redis'
import { getDegreeProgrammesOfFaculty } from './faculty'

type Graduated = 'GRADUATED_INCLUDED' | 'GRADUATED_EXCLUDED'
type SpecialGroups = 'SPECIAL_INCLUDED' | 'SPECIAL_EXCLUDED'
type ProgrammeFilter = 'NEW_STUDY_PROGRAMMES' | 'ALL_STUDY_PROGRAMMES'
type YearType = 'ACADEMIC_YEAR' | 'CALENDAR_YEAR'

const createRedisKeyForFacultyProgrammes = (id: string, programmeFilter: ProgrammeFilter) => {
  return `FACULTY_PROGRAMMES_${id}_${programmeFilter}`
}
const createRedisKeyForBasicStats = (
  id: string,
  yearType: YearType,
  programmeFilter: ProgrammeFilter,
  specialGroups: SpecialGroups
) => {
  return `FACULTY_BASIC_STATS_${id}_${yearType}_${programmeFilter}_${specialGroups}`
}
const createRedisKeyForThesiswriters = (
  id: string,
  yearType: YearType,
  programmeFilter: ProgrammeFilter,
  specialGroups: SpecialGroups
) => {
  return `FACULTY_THESIS_WRITERS_STATS_${id}_${yearType}_${programmeFilter}_${specialGroups}`
}
const createRedisKeyForGraduationTimeStats = (id: string, programmeFilter: ProgrammeFilter) => {
  return `FACULTY_GRADUATION_TIME_STATS_${id}_${programmeFilter}`
}
const createRedisKeyForFacultyProgress = (id: string, specialGroups: SpecialGroups, graduated: Graduated) => {
  return `FACULTY_PROGRESS_STATS_${id}_${specialGroups}_${graduated}`
}
const createRedisKeyForFacultyStudents = (id: string, specialGroups: SpecialGroups, graduated: Graduated) => {
  return `FACULTY_STUDENTS_STATS_${id}_${specialGroups}_${graduated}`
}

/*
  Faculty data objects have graduation times left in as arrays, so that
  university-level evaluation overview can count median-times by itself.
  Faculties, however, don't need this, and it isn't needed in frontend
  for universityview either. This removes them from the object.
*/
const removeGraduationTimes = (data: GraduationData) => {
  Object.values(data.byGradYear.medians).forEach(array =>
    array.forEach(yearStat => {
      yearStat.times = null
    })
  )
}

const setFacultyProgrammes = async (id: string, data, programmeFilter: ProgrammeFilter) => {
  const redisKey = createRedisKeyForFacultyProgrammes(id, programmeFilter)
  const dataToRedis = {
    data,
    status: 'DONE',
    lastUpdated: moment().format(),
  }
  const setOperationStatus = await redisClient.setAsync(redisKey, JSON.stringify(dataToRedis))
  if (setOperationStatus !== 'OK') {
    return null
  }
  return dataToRedis
}

const getFacultyProgrammesFromRedis = async (id: string, programmeFilter: ProgrammeFilter) => {
  const redisKey = createRedisKeyForFacultyProgrammes(id, programmeFilter)
  const dataFromRedis = await redisClient.getAsync(redisKey)
  if (!dataFromRedis) {
    return null
  }
  return JSON.parse(dataFromRedis)
}

export const getProgrammes = async (code: string, programmeFilter: ProgrammeFilter = 'NEW_STUDY_PROGRAMMES') => {
  const programmes = await getFacultyProgrammesFromRedis(code, programmeFilter)
  if (programmes) {
    return programmes
  }
  let updatedProgrammes: any = await getDegreeProgrammesOfFaculty(code, programmeFilter === 'NEW_STUDY_PROGRAMMES')
  if (updatedProgrammes) {
    updatedProgrammes = await setFacultyProgrammes(code, updatedProgrammes, programmeFilter)
  }
  return updatedProgrammes
}

type Info = {
  graphStats: Array<{ name: string; data: number[] }>
  programmeTableStats: Record<string, number[]>
  tableStats: Record<string, number[]>
  titles: string[]
}

type BasicData = {
  graduationInfo: Info
  id: string
  programmeNames: ProgrammeNames
  studentInfo: Info
  year: string[]
}

export const setBasicStats = async (
  data: BasicData,
  yearType: YearType,
  programmeFilter: ProgrammeFilter,
  specialGroups: SpecialGroups
) => {
  const { id } = data
  const redisKey = createRedisKeyForBasicStats(id, yearType, programmeFilter, specialGroups)
  const dataToRedis = {
    ...data,
    status: 'DONE',
    lastUpdated: moment().format(),
  }
  const setOperationStatus = await redisClient.setAsync(redisKey, JSON.stringify(dataToRedis))
  if (setOperationStatus !== 'OK') {
    return null
  }
  return dataToRedis
}

export const getBasicStats = async (
  id: string,
  yearType: YearType,
  programmeFilter: ProgrammeFilter,
  specialGroups: SpecialGroups
) => {
  const redisKey = createRedisKeyForBasicStats(id, yearType, programmeFilter, specialGroups)
  const dataFromRedis = await redisClient.getAsync(redisKey)
  if (!dataFromRedis) {
    return null
  }
  return JSON.parse(dataFromRedis) as BasicData & { status: string; lastUpdated: string }
}

type ProgrammeNames = Record<string, Name & { code: string }>

type ThesisWriterData = {
  id: string
  years: number[]
  tableStats: Array<number[]>
  graphStats: Array<number[]>
  programmeTableStats: Record<string, Array<number[]>>
  titles: string[]
  programmeNames: ProgrammeNames
  status: string
  lastUpdated: string
}

export const setThesisWritersStats = async (
  data: ThesisWriterData,
  yearType: YearType,
  programmeFilter: ProgrammeFilter,
  specialGroups: SpecialGroups
) => {
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

export const getThesisWritersStats = async (
  id: string,
  yearType: YearType,
  programmeFilter: ProgrammeFilter,
  specialGroups: SpecialGroups
) => {
  const redisKey = createRedisKeyForThesiswriters(id, yearType, programmeFilter, specialGroups)
  const dataFromRedis = await redisClient.getAsync(redisKey)
  if (!dataFromRedis) {
    return null
  }
  return JSON.parse(dataFromRedis) as ThesisWriterData & { status: string; lastUpdated: string }
}

type Statistics = { onTime: number; yearOver: number; wayOver: number }

type YearMedian = {
  amount: number
  name: number
  statistics: Statistics
  times: number[] | null
  median: number
}

type ProgrammeMedian = {
  data: {
    amount: number
    name: string
    statistics: Statistics
    code: string
    median: number
  }
  programmes: string[]
}

type MediansAndProgrammes = {
  medians: {
    bachelor: YearMedian[]
    master: YearMedian[]
    bcMsCombo: YearMedian[]
    doctor: YearMedian[]
  }
  programmes: {
    medians: {
      bachelor: Record<string, ProgrammeMedian>
      master: Record<string, ProgrammeMedian>
      bcMsCombo: Record<string, ProgrammeMedian>
      doctor: Record<string, ProgrammeMedian>
    }
  }
}

type GraduationData = {
  id: string
  goals: number | Record<string, number>
  byGradYear: MediansAndProgrammes
  byStartYear: MediansAndProgrammes
  programmeNames: Record<string, Name>
  classSizes: {
    programmes: Record<string, Record<string, number>>
    bachelor: Record<string, number>
    master: Record<string, number>
    bcMsCombo: Record<string, number>
    doctor: Record<string, number>
  }
}

export const setGraduationStats = async (data: GraduationData, programmeFilter: ProgrammeFilter) => {
  const { id } = data
  const redisKey = createRedisKeyForGraduationTimeStats(id, programmeFilter)
  const dataToRedis = {
    ...data,
    status: 'DONE',
    lastUpdated: moment().format(),
  }
  const setOperationStatus = await redisClient.setAsync(redisKey, JSON.stringify(dataToRedis))
  if (setOperationStatus !== 'OK') {
    return null
  }
  return dataToRedis
}

export const getGraduationStats = async (
  id: string,
  programmeFilter: ProgrammeFilter,
  keepGraduationTimes: boolean = false
) => {
  const redisKey = createRedisKeyForGraduationTimeStats(id, programmeFilter)
  const dataFromRedis = await redisClient.getAsync(redisKey)
  if (!dataFromRedis) {
    return null
  }
  const data = JSON.parse(dataFromRedis) as GraduationData & { status: string; lastUpdated: string }
  if (!keepGraduationTimes) {
    removeGraduationTimes(data)
  }
  return data
}

type Titles = Array<string[]>

type ProgrammeStats = Record<string, Record<string, Array<number[]>>>

type CreditCount = Record<string, number[]>

type FacultyProgressData = {
  id: string
  years: string[]
  yearlyBachelorTitles: Titles
  yearlyBcMsTitles: Titles
  yearlyMasterTitles: Titles
  yearlyLicentiateTitles: Titles
  programmeNames: ProgrammeNames
  bachelorsProgStats: ProgrammeStats
  bcMsProgStats: ProgrammeStats
  licentiateProgStats: ProgrammeStats
  mastersProgStats: ProgrammeStats
  doctoralProgStats: ProgrammeStats
  creditCounts: {
    bachelor: CreditCount
    bachelorMaster: CreditCount
    master: CreditCount
    licentiate: CreditCount
    doctor: CreditCount
  }
}

export const setFacultyProgressStats = async (
  data: FacultyProgressData,
  specialGroups: SpecialGroups,
  graduated: Graduated
) => {
  const { id } = data
  const redisKey = createRedisKeyForFacultyProgress(id, specialGroups, graduated)
  const dataToRedis = {
    ...data,
    status: 'DONE',
    lastUpdated: moment().format(),
  }
  const setOperationStatus = await redisClient.setAsync(redisKey, JSON.stringify(dataToRedis))
  if (setOperationStatus !== 'OK') {
    return null
  }
  return dataToRedis
}

export const getFacultyProgressStats = async (id: string, specialGroups: SpecialGroups, graduated: Graduated) => {
  const redisKey = createRedisKeyForFacultyProgress(id, specialGroups, graduated)
  const dataFromRedis = await redisClient.getAsync(redisKey)
  if (!dataFromRedis) {
    return null
  }
  return JSON.parse(dataFromRedis) as FacultyProgressData & { status: string; lastUpdated: string }
}

type FacultyStudentsData = {
  id: string
  years: string[]
  facultyTableStats: Record<string, Array<number | string>>
  facultyTableStatsExtra: Record<string, Record<string, Record<string, number>>>
  programmeStats: Record<string, Record<string, number[]>>
  titles: string[]
  programmeNames: Record<string, Name & { code: string; degreeProgrammeType: string; progId: string }>
}

export const setFacultyStudentStats = async (
  data: FacultyStudentsData,
  specialGroups: SpecialGroups,
  graduated: Graduated
) => {
  const { id } = data
  const redisKey = createRedisKeyForFacultyStudents(id, specialGroups, graduated)
  const dataToRedis = {
    ...data,
    status: 'DONE',
    lastUpdated: moment().format(),
  }
  const setOperationStatus = await redisClient.setAsync(redisKey, JSON.stringify(dataToRedis))
  if (setOperationStatus !== 'OK') {
    return null
  }
  return dataToRedis
}

export const getFacultyStudentStats = async (id: string, specialGroups: SpecialGroups, graduated: Graduated) => {
  const redisKey = createRedisKeyForFacultyStudents(id, specialGroups, graduated)
  const dataFromRedis = await redisClient.getAsync(redisKey)
  if (!dataFromRedis) {
    return null
  }
  return JSON.parse(dataFromRedis) as FacultyStudentsData & { status: string; lastUpdated: string }
}
