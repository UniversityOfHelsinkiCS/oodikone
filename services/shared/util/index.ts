import dayjs, { Dayjs, extend as dayjsExtend } from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'

import { Semester as BackendSemester } from '../models'

dayjsExtend(isBetween)
dayjsExtend(isSameOrAfter)
dayjsExtend(isSameOrBefore)

const handleUnderscoreProgrammeCode = (programmeCode: string) => {
  const [left, right] = programmeCode.split('_')
  const prefix = [...left].filter(char => !Number.isNaN(Number(char))).join('')
  const suffix = `${left[0]}${right}`
  return `${prefix}0-${suffix}`
}

const handleDoctoralProgrammeCode = (programmeCode: string) => {
  const numbers = programmeCode.substring(1)
  const courseProvider = Number(`7${numbers}`)
  if (courseProvider < 7920111 && courseProvider > 7920102) {
    return `${courseProvider + 1}`
  }
  if (courseProvider === 7920111) {
    return '7920103'
  }
  return `${courseProvider}`
}

const programmeCodeToProviderCode = (programmeCode: string) => {
  if (programmeCode.includes('_')) {
    return handleUnderscoreProgrammeCode(programmeCode)
  }
  if (/^(T)[0-9]{6}$/.test(programmeCode)) {
    return handleDoctoralProgrammeCode(programmeCode)
  }
  return programmeCode
}

export const mapToProviders = (programmeCodes: string[]) => {
  return programmeCodes.map(programmeCodeToProviderCode)
}

/**
 * Month is before september.
 */
export const isSpring = (date: Date) => date.getMonth() < 8

/** TODO: Do this better. Needs this funny type, because in frontend Semester has string dates, in backend only Date dates */
type CombinedSemester = {
  semestercode: number
  startdate: string | Date
  enddate: string | Date
}
/**
 * @returns semestercode that was active during the targetDate
 */
export const getSemesterCodeAt = (
  allSemesters: Record<string, CombinedSemester>,
  targetDate: Date | string | undefined
): number | undefined => {
  if (!targetDate) return undefined

  return Object.values(allSemesters ?? {}).find(
    semester =>
      new Date(semester.startdate) <= new Date(targetDate) && new Date(semester.enddate) >= new Date(targetDate)
  )?.semestercode
}

export const getCurrentSemester = (allSemesters: Record<string, BackendSemester>) => {
  if (!allSemesters) return null
  return Object.values(allSemesters).find(
    semester => new Date(semester.startdate) <= new Date() && new Date(semester.enddate) >= new Date()
  )
}

/**
 * @returns all semesters from semesterEnrollments that occurred partially or fully during a given period
 */
export const getSemestersBetweenRange = (start: Dayjs, end: Dayjs, allSemesters?: Record<string, CombinedSemester>) =>
  Object.values(allSemesters ?? {}).filter(semester => {
    const semesterStart = dayjs(semester.startdate)
    const semesterEnd = dayjs(semester.enddate)

    return dayjs(semesterStart).isSameOrBefore(end)
      ? semesterEnd.isSameOrAfter(start)
      : semesterStart.isSameOrBefore(end) && semesterEnd.isSameOrAfter(start)
  })

type Ok<T> = {
  data: T
  error: null
}

type Err<E> = {
  data: null
  error: E
}

type Result<T, E = Error> = Ok<T> | Err<E>

/**
 * @returns data, error object with distinct values.
 * This should make it easier to read and write error catching code.
 */
export const tryCatch = async <T, E = Error>(ret: Promise<T> | T): Promise<Result<T, E>> => {
  try {
    const data = await ret
    return { data, error: null }
  } catch (error) {
    return { data: null, error: error as E }
  }
}

export const formatToArray = <T>(param: T | T[]): T[] => {
  return Array.isArray(param) ? param : [param]
}

export const omitKeys = <T extends object, K extends keyof T>(input: T, toOmit: K[]): Omit<T, K> => {
  return Object.fromEntries(Object.entries(input).filter(([key, _]) => !toOmit.includes(key as K))) as Omit<T, K>
}

export const keyBy = <T extends object, K extends keyof T>(input: T[] | undefined, key: K): Record<K, T> =>
  Object.fromEntries(input?.map(item => [item[key], item]) ?? [])

export const mapValues = <T extends object, K extends keyof T, R>(input: T, f: (value: [K, T[K]]) => [K, R]) => {
  return Object.fromEntries(Object.entries(input).map(entry => f(entry as [K, T[K]])))
}

export const splitByEmptySpace = (str: string) => str.split(/\s+/g)

/*
 * Returns range of values (exclusive) between start..end or 0..start.
 */
export const range = (start: number, end?: number, step?: number): number[] => {
  const a = end !== undefined ? start : 0
  const b = end ?? start
  const c = step ?? 1

  const length = Math.max(Math.ceil((b - a) / c), 0)
  return Array.from({ length }, (_, index) => a + c * index)
}

/** NOTE: Date when Oodikone changed from Oodi to Sisu. Before it
there are generally no studyright_id attached to enrollments */
export const enrollmentTimeDateThreshold = new Date('2021-05-31')
export const enrollmentTimeDateThresholdYearCode = 72
