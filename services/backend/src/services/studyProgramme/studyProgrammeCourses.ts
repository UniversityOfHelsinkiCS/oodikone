import { range } from 'lodash-es'

import { Name, StudyProgrammeCourse } from '@oodikone/shared/types'
import { mapToProviders } from '@oodikone/shared/util'
import { getOpenUniCourseCode } from '../../util'
import { getCurrentStudyYearStartDate, getNotCompletedForProgrammeCourses, getAllProgrammeCourses } from '.'
import {
  getOtherStudentsForProgrammeCourses,
  getOwnStudentsForProgrammeCourses,
  getStudentsForProgrammeCourses,
  getStudentsWithoutStudyRightForProgrammeCourses,
  getTransferStudentsForProgrammeCourses,
} from './studentGetters'


const getAllStudyProgrammeCourses = async (studyProgramme: string) => {
  const providerCode = mapToProviders([studyProgramme])[0]
  const normalCourses = await getAllProgrammeCourses(providerCode)
  return normalCourses.reduce((acc, curr) => {
    acc.push(curr.code)
    if (curr.substitutions?.includes(`AY${curr.code}`)) {
      acc.push(`AY${curr.code}`)
    }
    return acc
  }, [] as string[])
}

const getCurrentYearStartDate = () => new Date(new Date().getFullYear(), 0, 1)

const getFrom = (academicYear: string, year: number) => academicYear === 'ACADEMIC_YEAR'
  ? new Date(year, 7, 1, 0, 0, 0)
  : new Date(year, 0, 1, 0, 0, 0)

const getTo = (academicYear: string, year: number) => academicYear === 'ACADEMIC_YEAR'
  ? new Date(year + 1, 6, 31, 23, 59, 59)
  : new Date(year, 11, 31, 23, 59, 59)

const promiseKeys = ['passed', 'notCompleted', 'ownStudents', 'withoutStudyRight', 'otherStudents', 'transfer'] as const


type CommonFields = {
  code: string,
  name: Name,
  year: number,
  type: string,
  isStudyModule?: boolean
}
type YearlyFields = StudyProgrammeCourse["years"][number]
type CombinedPromises = Promise<(CommonFields & Partial<YearlyFields>)[]>[]

const makeYearlyPromises = (
  years: number[],
  academicYear: string,
  type: typeof promiseKeys[number],
  programmeCourses: string[],
  studyProgramme: string
): CombinedPromises => years.map(async year => {
  const from = getFrom(academicYear, year)
  const to = getTo(academicYear, year)

  const addYear = <T extends object>(course: T) => {
    course["year"] = year
    return course as T & { year: number }
  }

  switch (type) {
    case 'passed':
      return (await getStudentsForProgrammeCourses(from, to, programmeCourses)).map(addYear)
    case 'notCompleted':
      return (await getNotCompletedForProgrammeCourses(from, to, programmeCourses)).map(addYear)
    case 'ownStudents':
      return (await getOwnStudentsForProgrammeCourses(from, to, programmeCourses, studyProgramme)).map(addYear)
    case 'withoutStudyRight':
      return (await getStudentsWithoutStudyRightForProgrammeCourses(from, to, programmeCourses)).map(addYear)
    case 'otherStudents':
      return (await getOtherStudentsForProgrammeCourses(from, to, programmeCourses, studyProgramme)).map(addYear)
    case 'transfer':
      return (await getTransferStudentsForProgrammeCourses(from, to, programmeCourses)).map(addYear)
  }
})

const emptyStats = {
  totalAllStudents: 0,
  totalPassed: 0,
  totalNotCompleted: 0,
  totalAllCredits: 0,
  totalProgrammeStudents: 0,
  totalProgrammeCredits: 0,
  totalOtherProgrammeStudents: 0,
  totalOtherProgrammeCredits: 0,
  totalWithoutStudyRightStudents: 0,
  totalWithoutStudyRightCredits: 0,
  totalTransferCredits: 0,
  totalTransferStudents: 0,
} as const

export const getStudyProgrammeCoursesForStudyTrack = async (
  unixMillis: number,
  studyProgramme: string,
  academicYear: string,
  combinedProgramme: string
) => {
  const startDate =
    academicYear === 'ACADEMIC_YEAR' ? await getCurrentStudyYearStartDate(unixMillis) : getCurrentYearStartDate()
  const startYear = startDate.getFullYear()
  const yearRange = range(2017, startYear + 1)
  const mainProgrammeCourses = await getAllStudyProgrammeCourses(studyProgramme)
  const secondProgrammeCourses = combinedProgramme ? await getAllStudyProgrammeCourses(combinedProgramme) : []
  const programmeCourses = [...mainProgrammeCourses, ...secondProgrammeCourses]

  const courses = (await Promise.all(promiseKeys.flatMap(key => makeYearlyPromises(yearRange, academicYear, key, programmeCourses, studyProgramme)))).flat()

  let maxYear = 0
  const allCourses = courses.reduce(
    (acc, currentCourseStats) => {
      if (currentCourseStats.year! > maxYear) {
        maxYear = currentCourseStats.year!
      }

      acc[currentCourseStats.code] ??= {
        code: currentCourseStats.code,
        name: currentCourseStats.name,
        isStudyModule: !!currentCourseStats.isStudyModule,
        years: {},
      }

      acc[currentCourseStats.code].years[currentCourseStats.year!] ??= {
        ...emptyStats,
        isStudyModule: !!currentCourseStats.isStudyModule,
      }

      const currentYear = acc[currentCourseStats.code].years[currentCourseStats.year!]

      switch (currentCourseStats.type) {
        case 'passed':
          currentYear.totalPassed += currentCourseStats.totalPassed ?? 0
          currentYear.totalAllStudents += currentYear.totalPassed
          currentYear.totalAllCredits += currentCourseStats.totalAllCredits ?? 0
          break
        case 'notCompleted':
          currentYear.totalNotCompleted += currentCourseStats.totalNotCompleted ?? 0
          currentYear.totalAllStudents += currentYear.totalNotCompleted
          break
        case 'ownProgramme':
          currentYear.totalProgrammeStudents += currentCourseStats.totalProgrammeStudents ?? 0
          currentYear.totalProgrammeCredits += currentCourseStats.totalProgrammeCredits ?? 0
          break
        case 'otherProgramme':
          currentYear.totalOtherProgrammeStudents += currentCourseStats.totalOtherProgrammeStudents ?? 0
          currentYear.totalOtherProgrammeCredits += currentCourseStats.totalOtherProgrammeCredits ?? 0
          break
        case 'noStudyright':
          currentYear.totalWithoutStudyRightStudents += currentCourseStats.totalWithoutStudyRightStudents ?? 0
          currentYear.totalWithoutStudyRightCredits += currentCourseStats.totalWithoutStudyRightCredits ?? 0
          break
        case 'transfer':
          currentYear.totalTransferStudents += currentCourseStats.totalTransferStudents ?? 0
          currentYear.totalTransferCredits += currentCourseStats.totalTransferCredits ?? 0
          break
      }
      return acc
    },
    {} as Record<string, StudyProgrammeCourse>
  )

  const ayCourses = Object.keys(allCourses).filter(courseCode => courseCode.startsWith('AY'))
  const properties = Object.keys(emptyStats)

  ayCourses.forEach(ayCourse => {
    const openUniCourseCode = getOpenUniCourseCode(ayCourse)
    if (!openUniCourseCode) return

    const normCode = openUniCourseCode[1]

    if (allCourses[normCode]) {
      const mergedCourse = {} as StudyProgrammeCourse
      mergedCourse.code = allCourses[normCode].code
      mergedCourse.name = allCourses[normCode].name
      mergedCourse.years = {}

      yearRange
        .filter(year => year <= maxYear)
        .forEach(year => {
          if (!allCourses[normCode].years[year]) {
            mergedCourse.years[year] = emptyStats
          } else {
            mergedCourse.years[year] = { ...allCourses[normCode].years[year] }
          }
          if (allCourses[ayCourse].years[year]) {
            properties.forEach(prop => {
              mergedCourse.years[year][prop] += allCourses[ayCourse].years[year][prop]
            })
          }
        })
      allCourses[normCode] = mergedCourse
      delete allCourses[ayCourse]
    }
  })
  return Object.values(allCourses)
}
