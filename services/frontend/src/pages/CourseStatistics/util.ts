import type { CourseSearchState } from '@/pages/CourseStatistics'
import { CourseStat, Realisation } from '@/types/courseStat'
import { Name } from '@oodikone/shared/types'

export type CourseStats = Record<string, { openStats: CourseStat; regularStats: CourseStat; unifyStats: CourseStat }>
export type CourseStudyProgramme = {
  key: string
  value: string
  description: string
  text: Name
  students: Record<string, string[]>
}
export type CourseStatisticsSummary = {
  coursecode: string
  name: Name
  summary: { passed: number; failed: number; passRate: string | null }
  realisations: { realisation: string; passed: number; failed: number; passRate: string | null; obfuscated?: boolean }[]
}[]

export const ALL = {
  key: 'ALL',
  value: 'ALL',
  text: {
    fi: 'All',
    en: 'All',
    sv: 'All',
  },
  description: 'All students combined',
} as const

const MIN_YEAR = 1899
const MAX_YEAR = 2112

const isSpring = (date: Date) => date.getMonth() < 9
const isPre2016Course = course => !Number.isNaN(Number(course.code.charAt(0)))
const getYearText = (year: number, spring: boolean) => (spring ? `Spring ${year}` : `Fall ${year}`)

export const getActiveYears = course => {
  if (!course.min_attainment_date && !course.max_attainment_date) return 'No attainments yet'

  const min_attainment_date = new Date(course.min_attainment_date)
  const max_attainment_date = new Date(course.max_attainment_date)

  const [startYear, endYear] = [min_attainment_date.getFullYear(), max_attainment_date.getFullYear()]

  const startYearText = getYearText(startYear, isSpring(min_attainment_date))
  const endYearText = getYearText(endYear, isSpring(max_attainment_date))

  if (endYear === MAX_YEAR && isPre2016Course(course)) return `— ${getYearText(2016, false)}`
  else if (startYear === MIN_YEAR) return `— ${endYearText}`
  else if (endYear === MAX_YEAR) return `${startYearText} — `
  else if (startYearText === endYearText) return startYearText

  return `${startYearText} — ${endYearText}`
}

export const formatPassRate = (passRate: string | null) => {
  if (!passRate) {
    return '-'
  }
  return `${passRate} %`
}

export const getCourseStats = (
  courseStats: CourseStats,
  openOrRegular: CourseSearchState
): Record<string, CourseStat> =>
  Object.fromEntries(Object.entries(courseStats).map(([courseCode, value]) => [courseCode, value[openOrRegular]]))

export const getCourseAlternativeCodes = (
  courseStats: CourseStats,
  openOrRegular: CourseSearchState,
  selectedCourse: string | undefined
): string[] => courseStats[selectedCourse!]?.[openOrRegular].alternatives?.map(({ code }) => code) ?? []

export const getAvailableStats = (
  courseStats: CourseStats
): Record<string, { unify: boolean; open: boolean; university: boolean }> =>
  Object.fromEntries(
    Object.entries(courseStats).map(([courseCode, value]) => [
      courseCode,
      {
        unify: !!value.unifyStats.statistics.length,
        open: !!value.openStats.statistics.length,
        university: !!value.regularStats.statistics.length,
      },
    ])
  )

const mergeStudents = (students1: Record<string, string[]>, students2: Record<string, string[]>) => {
  Object.keys(students2).forEach(yearCode => {
    if (students1[yearCode]) {
      students1[yearCode] = [...students1[yearCode], ...students2[yearCode]]
    } else {
      students1[yearCode] = students2[yearCode]
    }
  })
  return students1
}

export const getAllStudyProgrammes = (
  courseStats: Record<string, CourseStat>,
  selectedCourseCode: string | undefined
): CourseStudyProgramme[] => {
  const studentsFilterSet = new Set(
    selectedCourseCode
      ? courseStats[selectedCourseCode]?.statistics?.flatMap(({ students }) => students.studentNumbers)
      : Object.values(courseStats).flatMap(programme =>
          programme.statistics.flatMap(({ students }) => students.studentNumbers)
        )
  )

  const all: Record<string, CourseStudyProgramme> = {}
  Object.values(courseStats).forEach(({ programmes }) => {
    Object.entries(programmes).forEach(([code, { name, students }]) => {
      const filteredStudents = Object.entries(students).reduce<Record<string, string[]>>(
        (acc, [k, v]) => ({ ...acc, [k]: v.filter(student => studentsFilterSet.has(student)) }),
        {}
      )

      if (all[code]) all[code].students = mergeStudents(all[code].students, filteredStudents)
      else
        all[code] = {
          key: code,
          value: code,
          description: code === 'OTHER' ? 'Students with no associated programme' : '',
          text: name,
          students: filteredStudents,
        }
    })
  })

  const programmes = Object.values(all)
  const allStudents = programmes.reduce<Record<string, string[]>>((acc, curr) => mergeStudents(acc, curr.students), {})
  return [{ ...ALL, students: allStudents }, ...programmes]
}

const calculatePassRate = (passed: number, failed: number) => {
  const passRate = (100 * passed) / (passed + failed)
  return passRate ? passRate.toFixed(2) : null
}

const getRealisationStats = (
  realisation: Realisation,
  filterStudentFn: (studentNumber: string) => boolean,
  userHasAccessToAllStats: boolean
) => {
  const { name, attempts, obfuscated } = realisation
  const { passed, failed } = attempts.categories
  const passedAmount = userHasAccessToAllStats ? passed.filter(filterStudentFn).length : passed.length
  const failedAmount = userHasAccessToAllStats ? failed.filter(filterStudentFn).length : failed.length
  return {
    passed: passedAmount,
    failed: failedAmount,
    realisation: name,
    passRate: calculatePassRate(passedAmount, failedAmount),
    obfuscated,
  }
}

const parseSummaryStats = (
  statistics: Realisation[],
  filterStudentFn: (studentNumber: string) => boolean,
  userHasAccessToAllStats: boolean
) => {
  const summary = statistics.reduce<{ passed: number; failed: number }>(
    (acc, cur) => {
      const { passed, failed } = cur.attempts.categories
      acc.passed += userHasAccessToAllStats ? passed.filter(filterStudentFn).length : passed.length
      acc.failed += userHasAccessToAllStats ? failed.filter(filterStudentFn).length : failed.length
      return acc
    },
    { passed: 0, failed: 0 }
  )

  return { ...summary, passRate: calculatePassRate(summary.passed, summary.failed) }
}

export const getSummaryStatistics = (
  courseStats: Record<string, CourseStat>,
  programmes: CourseStudyProgramme[],
  programmeCodes: string[],
  userHasAccessToAllStats: boolean
): CourseStatisticsSummary => {
  const filteredProgrammes = programmes.filter(programme => programmeCodes.includes(programme.key))
  const students = new Set(filteredProgrammes.flatMap(programme => Object.values(programme.students).flat()))

  const filterStudentFn = (studentNumber: string) => students.has(studentNumber)

  return Object.entries(courseStats).map(([coursecode, { statistics, name }]) => ({
    coursecode,
    name,
    summary: parseSummaryStats(statistics, filterStudentFn, userHasAccessToAllStats),
    // No filters based on programmes can be applied, if the
    // programme and student number data has been obfuscated
    realisations: statistics.map(realisation =>
      getRealisationStats(realisation, filterStudentFn, userHasAccessToAllStats)
    ),
  }))
}
