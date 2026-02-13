import { range } from 'lodash-es'

import { Name, StudyProgrammeCourse, YearType } from '@oodikone/shared/types'
import { mapToProviders } from '@oodikone/shared/util'
import { createEmptyStats, YearStats } from '@oodikone/shared/util/studyProgramme'

import { getAllProgrammeCourses, getCurrentStudyYearStartDate, getNotCompletedForProgrammeCourses } from '.'
import { getProgrammeCourseAggregates, getTransferCourseAggregates } from './studentGetters'

const START_YEAR = 2017
const JULY = 6
const AUGUST = 7

const getCurrentYearStartDate = () => new Date(new Date().getFullYear(), 0, 1)

const getFrom = (yearType: YearType, year: number) =>
  yearType === 'ACADEMIC_YEAR' ? new Date(year, AUGUST, 1, 0, 0, 0) : new Date(year, 0, 1, 0, 0, 0)

const getTo = (yearType: YearType, year: number) =>
  yearType === 'ACADEMIC_YEAR' ? new Date(year + 1, JULY, 31, 23, 59, 59) : new Date(year, 11, 31, 23, 59, 59)

const getAllStudyProgrammeCourses = async (studyProgramme: string) => {
  const providerCode = mapToProviders([studyProgramme])[0]
  if (!providerCode) return []

  const normalCourses = await getAllProgrammeCourses(providerCode)
  const courseCodes = new Set<string>()

  for (const course of normalCourses) {
    courseCodes.add(course.code)
    if (course.substitutions?.includes(`AY${course.code}`)) {
      courseCodes.add(`AY${course.code}`)
    }
  }

  return [...courseCodes]
}

const getYearKey = (date: Date, isAcademicYear: boolean) => {
  const year = date.getFullYear()
  if (!isAcademicYear) return year
  return date.getMonth() >= 7 ? year : year - 1
}

type YearAccumulator = {
  stats: YearStats
  allPassed: Set<string>

  degreeStudents: Set<string>
  exchangeStudents: Set<string>
  otherUniversityStudents: Set<string>
  separateStudents: Set<string>
  otherStudents: Set<string>

  openStudents: Set<string>
  transferStudents: Set<string>
}

type CourseAccumulator = {
  code: string
  name: Name
  isStudyModule: boolean
  years: Map<number, YearAccumulator>
}

const createYearAccumulator = (isStudyModule: boolean): YearAccumulator => ({
  stats: createEmptyStats(isStudyModule),
  allPassed: new Set(),
  degreeStudents: new Set(),
  exchangeStudents: new Set(),
  otherUniversityStudents: new Set(),
  separateStudents: new Set(),
  otherStudents: new Set(),

  openStudents: new Set(),
  transferStudents: new Set(),
})

const ensureCourse = (
  courseMap: Map<string, CourseAccumulator>,
  code: string,
  name: Name,
  isStudyModule: boolean
): CourseAccumulator => {
  if (!courseMap.has(code)) {
    courseMap.set(code, {
      code,
      name,
      isStudyModule,
      years: new Map(),
    })
  }

  const course = courseMap.get(code)!
  course.isStudyModule = course.isStudyModule || isStudyModule
  course.name = course.name ?? name
  return course
}

const ensureYear = (course: CourseAccumulator, year: number, isStudyModule: boolean) => {
  if (!course.years.has(year)) {
    course.years.set(year, createYearAccumulator(isStudyModule))
  }
  const yearAccumulator = course.years.get(year)!
  yearAccumulator.stats.isStudyModule ??= isStudyModule
  return yearAccumulator
}

const finalizeYearStats = (yearAccumulator: YearAccumulator): YearStats => {
  const { stats } = yearAccumulator

  stats.allPassed = yearAccumulator.allPassed.size

  stats.degreeStudents = yearAccumulator.degreeStudents.size
  stats.exchangeStudents = yearAccumulator.exchangeStudents.size
  stats.otherUniversityStudents = yearAccumulator.otherUniversityStudents.size
  stats.separateStudents = yearAccumulator.separateStudents.size
  stats.otherStudents = yearAccumulator.otherStudents.size

  stats.openStudents = yearAccumulator.openStudents.size
  stats.transferStudents = yearAccumulator.transferStudents.size

  stats.allStudents = stats.allPassed + stats.allNotPassed

  return stats
}

const getYearRange = async (unixMillis: number, isAcademicYear: boolean) => {
  const startDate = isAcademicYear ? await getCurrentStudyYearStartDate(unixMillis) : getCurrentYearStartDate()
  const lastYear = startDate.getFullYear()
  return range(START_YEAR, lastYear + 1)
}

export const getStudyProgrammeCoursesForStudyTrack = async (
  unixMillis: number,
  studyProgramme: string,
  academicYear: YearType,
  combinedProgramme: string
) => {
  const isAcademicYear = academicYear === 'ACADEMIC_YEAR'
  const yearRange = await getYearRange(unixMillis, isAcademicYear)
  if (yearRange.length === 0) {
    return []
  }

  const mainProgrammeCourses = await getAllStudyProgrammeCourses(studyProgramme)
  const secondProgrammeCourses = combinedProgramme ? await getAllStudyProgrammeCourses(combinedProgramme) : []
  const programmeCourses = [...new Set([...mainProgrammeCourses, ...secondProgrammeCourses])]

  if (programmeCourses.length === 0) {
    return []
  }

  const firstYear = yearRange[0]
  const lastYear = yearRange[yearRange.length - 1]
  const from = getFrom(academicYear, firstYear)
  const to = getTo(academicYear, lastYear)

  const [programmeCredits, transferCredits] = await Promise.all([
    getProgrammeCourseAggregates({
      courseCodes: programmeCourses,
      from,
      to,
    }),
    getTransferCourseAggregates({
      courseCodes: programmeCourses,
      from,
      to,
    }),
  ])

  const courseMap = new Map<string, CourseAccumulator>()
  let maxYear = 0

  for (const row of programmeCredits) {
    const attainmentDate = new Date(row.attainmentDate)
    const year = getYearKey(attainmentDate, isAcademicYear)

    if (!yearRange.includes(year)) continue
    maxYear = Math.max(maxYear, year)

    const course = ensureCourse(courseMap, row.courseCode, row.courseName, row.isStudyModule)
    const yearAccumulator = ensureYear(course, year, row.isStudyModule)
    const { stats } = yearAccumulator

    stats.allCredits += row.credits
    yearAccumulator.allPassed.add(row.studentNumber)

    // Order here is important
    // e.g. degree student can have many open uni study rights => still group as degree student
    // Open uni students should only have open uni studyrights
    switch (row.variant) {
      case 'degree':
        yearAccumulator.degreeStudents.add(row.studentNumber)
        stats.degreeStudentsCredits += row.credits
        break
      case 'exchange':
        yearAccumulator.exchangeStudents.add(row.studentNumber)
        stats.exchangeStudentsCredits += row.credits
        break
      case 'separate':
        yearAccumulator.separateStudents.add(row.studentNumber)
        stats.separateStudentsCredits += row.credits
        break
      case 'otherUniversity':
        yearAccumulator.otherUniversityStudents.add(row.studentNumber)
        stats.otherUniversityCredits += row.credits
        break
      case 'other':
        yearAccumulator.otherStudents.add(row.studentNumber)
        stats.otherStudentsCredits += row.credits
        break
      case 'openUni':
        yearAccumulator.openStudents.add(row.studentNumber)
        stats.openStudentsCredits += row.credits
        break
      default:
        break
    }
  }

  for (const row of transferCredits) {
    const attainmentDate = new Date(row.attainmentDate)
    const year = getYearKey(attainmentDate, isAcademicYear)
    if (!yearRange.includes(year)) continue
    maxYear = Math.max(maxYear, year)

    const course = ensureCourse(courseMap, row.courseCode, row.courseName, row.isStudyModule)
    const yearAccumulator = ensureYear(course, year, row.isStudyModule)
    yearAccumulator.transferStudents.add(row.studentNumber)
    yearAccumulator.stats.transferStudentsCredits += row.credits
  }

  const notCompletedResults = await Promise.all(
    yearRange.map(year => {
      const yearFrom = getFrom(academicYear, year)
      const yearTo = getTo(academicYear, year)
      return getNotCompletedForProgrammeCourses(yearFrom, yearTo, programmeCourses)
    })
  )

  notCompletedResults.forEach((results, index) => {
    const year = yearRange[index]
    if (!results) return
    if (results.length > 0) {
      maxYear = Math.max(maxYear, year)
    }
    for (const result of results) {
      const course = ensureCourse(courseMap, result.code, result.name, result.isStudyModule ?? false)
      const yearAccumulator = ensureYear(course, year, result.isStudyModule ?? false)
      yearAccumulator.stats.allNotPassed += result.allNotPassed
    }
  })

  if (maxYear === 0) {
    maxYear = lastYear
  }

  const coursesRecord: Record<string, StudyProgrammeCourse> = {}

  for (const [code, course] of courseMap.entries()) {
    const years: Record<number, YearStats> = {}
    for (const [year, yearAccumulator] of course.years.entries()) {
      if (year > maxYear) continue
      years[year] = finalizeYearStats(yearAccumulator)
    }

    if (Object.keys(years).length === 0) {
      continue
    }

    coursesRecord[code] = {
      code,
      name: course.name,
      isStudyModule: course.isStudyModule,
      years,
    }
  }

  return Object.values(coursesRecord)
}
