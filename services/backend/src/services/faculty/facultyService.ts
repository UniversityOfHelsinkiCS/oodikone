import moment from 'moment'

import { Graduated, Name, ProgrammeFilter, SpecialGroups, YearType, DegreeProgrammeType } from '@oodikone/shared/types'
import { redisClient } from '../redis'
import { FacultyProgressData } from './facultyStudentProgress'

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

type GraduationInfo = {
  graphStats: {
    name: 'Bachelors' | 'Masters' | 'Doctors' | 'Others'
    data?: number[]
  }[]
  programmeTableStats: Record<string, (string | number)[][]>
  tableStats: (string | number)[][]
  titles: string[]
}

type StudentInfo = {
  graphStats: {
    name: string
    data: any
  }[]
  programmeTableStats: Record<string, any[][]>
  tableStats: any[][]
  titles: string[]
}

type BasicData = {
  graduationInfo: GraduationInfo
  id: string
  programmeNames: ProgrammeNames
  studentInfo: StudentInfo
  years: Array<number | string>
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
  const setOperationStatus = await redisClient.set(redisKey, JSON.stringify(dataToRedis))
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
  const dataFromRedis = await redisClient.get(redisKey)
  if (!dataFromRedis) {
    return null
  }
  return JSON.parse(dataFromRedis) as BasicData & { status: string; lastUpdated: string }
}

type ProgrammeNames = Record<string, Name & { code: string }>

type ThesisWriterData = {
  id: string
  years: (string | number)[]
  tableStats: (string | number)[][]
  graphStats: {
    name: 'Bachelors' | 'Masters'
    data?: number[]
  }[]
  programmeTableStats: Record<string, (string | number)[][]>
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
  const setOperationStatus = await redisClient.set(redisKey, JSON.stringify(dataToRedis))
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
  const dataFromRedis = await redisClient.get(redisKey)
  if (!dataFromRedis) {
    return null
  }
  return JSON.parse(dataFromRedis) as ThesisWriterData & { status: string; lastUpdated: string }
}

type MediansAndProgrammes = {
  medians: Record<string, any[]>
  programmes: {
    medians: Record<string, Record<string, any>>
  }
}

type GraduationData = {
  id: string
  goals: {
    bachelor: number
    bcMsCombo: number
    master: number
    doctor: number
    exceptions: Record<string, number>
  }
  byGradYear: MediansAndProgrammes
  byStartYear: MediansAndProgrammes
  programmeNames: Record<string, Name>
  classSizes: Record<string, Record<string, number | Record<string, number>>>
}

export const setGraduationStats = async (data: GraduationData, programmeFilter: ProgrammeFilter) => {
  const { id } = data
  const redisKey = createRedisKeyForGraduationTimeStats(id, programmeFilter)
  const dataToRedis = {
    ...data,
    status: 'DONE',
    lastUpdated: moment().format(),
  }
  const setOperationStatus = await redisClient.set(redisKey, JSON.stringify(dataToRedis))
  if (setOperationStatus !== 'OK') {
    return null
  }
  return dataToRedis
}

export const getGraduationStats = async (id: string, programmeFilter: ProgrammeFilter, keepGraduationTimes = false) => {
  const redisKey = createRedisKeyForGraduationTimeStats(id, programmeFilter)
  const dataFromRedis = await redisClient.get(redisKey)
  if (!dataFromRedis) {
    return null
  }
  const data = JSON.parse(dataFromRedis) as GraduationData & { status: string; lastUpdated: string }
  if (!keepGraduationTimes) {
    removeGraduationTimes(data)
  }
  return data
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
  const setOperationStatus = await redisClient.set(redisKey, JSON.stringify(dataToRedis))
  if (setOperationStatus !== 'OK') {
    return null
  }
  return dataToRedis
}

export const getFacultyProgressStats = async (id: string, specialGroups: SpecialGroups, graduated: Graduated) => {
  const redisKey = createRedisKeyForFacultyProgress(id, specialGroups, graduated)
  const dataFromRedis = await redisClient.get(redisKey)
  if (!dataFromRedis) {
    return null
  }
  return JSON.parse(dataFromRedis) as FacultyProgressData & { status: string; lastUpdated: string }
}

type FacultyStudentsData = {
  id: string
  years: string[]
  facultyTableStats: Record<string, (string | number)[]>
  facultyTableStatsExtra: Record<string, Record<string, Record<string, number>>>
  programmeStats: Record<string, Record<string, (string | number)[]>>
  titles: string[]
  programmeNames: Record<
    string,
    { name: Name; code: string; degreeProgrammeType: DegreeProgrammeType | null; progId: string }
  >
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
  const setOperationStatus = await redisClient.set(redisKey, JSON.stringify(dataToRedis))
  if (setOperationStatus !== 'OK') {
    return null
  }
  return dataToRedis
}

export const getFacultyStudentStats = async (id: string, specialGroups: SpecialGroups, graduated: Graduated) => {
  const redisKey = createRedisKeyForFacultyStudents(id, specialGroups, graduated)
  const dataFromRedis = await redisClient.get(redisKey)
  if (!dataFromRedis) {
    return null
  }
  return JSON.parse(dataFromRedis) as FacultyStudentsData & { status: string; lastUpdated: string }
}
