import { orderBy, range } from 'lodash'
import { Op } from 'sequelize'

import { Credit, Enrollment } from '../../models'
import { mapToProviders } from '../../shared/util/mapToProviders'
import { CreditTypeCode, EnrollmentState, Name } from '../../types'
import { isOpenUniCourseCode } from '../../util'
import { createArrayOfCourses } from '../languageCenterData'
import {
  getOtherStudentsForProgrammeCourses,
  getOwnStudentsForProgrammeCourses,
  getStudentsForProgrammeCourses,
  getStudentsWithoutStudyRightForProgrammeCourses,
  getTransferStudentsForProgrammeCourses,
} from './studentGetters'
import { getCurrentStudyYearStartDate, getNotCompletedForProgrammeCourses, getAllProgrammeCourses } from '.'

const getCurrentYearStartDate = () => {
  return new Date(new Date().getFullYear(), 0, 1)
}

const getAllStudyProgrammeCourses = async (studyProgramme: string) => {
  // and here what we really want is all courses that have been taught "as a part of the studyprogramme" - how is this defined?
  const providerCode = mapToProviders([studyProgramme])[0]
  const normalCourses = await getAllProgrammeCourses(providerCode)
  return normalCourses.reduce((acc, curr) => {
    acc.push(curr.code)
    if (curr.substitutions && curr.substitutions.includes(`AY${curr.code}`)) {
      acc.push(`AY${curr.code}`)
    }
    return acc
  }, [] as string[])
}

const getFrom = (academicYear: string, year: number) => {
  return academicYear === 'ACADEMIC_YEAR' ? new Date(year, 7, 1, 0, 0, 0) : new Date(year, 0, 1, 0, 0, 0)
}

const getTo = (academicYear: string, year: number) => {
  return academicYear === 'ACADEMIC_YEAR' ? new Date(year + 1, 6, 31, 23, 59, 59) : new Date(year, 11, 31, 23, 59, 59)
}

// * Combined return type, should be split into smaller types
type Students = {
  code: string
  name: Name
  type: string
  isStudyModule?: boolean
  year?: number
  totalPassed?: number
  totalAllCredits?: number
  totalNotCompleted?: number
  totalProgrammeStudents?: number
  totalProgrammeCredits?: number
  totalWithoutStudyrightStudents?: number
  totalWithoutStudyrightCredits?: number
  totalOtherProgrammeStudents?: number
  totalOtherProgrammeCredits?: number
  totalTransferStudents?: number
  totalTransferCredits?: number
}

// TODO: It would be a good idea to split this into smaller functions
// The amount of different return types makes this very messy
const makeYearlyPromises = (
  years: number[],
  academicYear: string,
  type: 'passed' | 'notCompleted' | 'ownStudents' | 'withoutStudyRight' | 'otherStudents' | 'transfer',
  programmeCourses: string[],
  studyProgramme?: string
): Promise<Students[]>[] => {
  return years.map(
    year =>
      // eslint-disable-next-line no-async-promise-executor
      new Promise(async res => {
        const from = getFrom(academicYear, year)
        const to = getTo(academicYear, year)
        let result: Students[] | null = null

        switch (type) {
          case 'passed':
            result = await getStudentsForProgrammeCourses(from, to, programmeCourses)
            break
          case 'notCompleted':
            result = await getNotCompletedForProgrammeCourses(from, to, programmeCourses)
            break
          case 'ownStudents':
            result = await getOwnStudentsForProgrammeCourses(from, to, programmeCourses, studyProgramme)
            break
          case 'withoutStudyRight':
            result = await getStudentsWithoutStudyRightForProgrammeCourses(from, to, programmeCourses)
            break
          case 'otherStudents':
            result = await getOtherStudentsForProgrammeCourses(from, to, programmeCourses, studyProgramme)
            break
          case 'transfer':
            result = await getTransferStudentsForProgrammeCourses(from, to, programmeCourses)
            break
          default:
            result = await getStudentsForProgrammeCourses(from, to, programmeCourses)
        }

        res(
          result.map(course => {
            course.year = year
            return course
          })
        )
      })
  )
}

type Attempt = {
  studentNumber: string
  courseCode: string
  completed: boolean
  date: Date
  semestercode: number
  enrolled?: boolean
}

type Course = {
  code: string
  name: Name
  isStudyModule: boolean
  years: Record<number, any>
}

export const getStudyProgrammeStatsForColorizedCoursesTable = async (studyProgramme: string) => {
  // all courses in some meaningful way linked to a study programme.
  // Would that be via which courses the students with a study right linked to a study programme have taken?
  const courses = await getAllProgrammeCourses(mapToProviders([studyProgramme])[0])
  const autumnSemester2017 = 135
  const courseCodes = courses.map(course => course.code)

  const credits = await Credit.findAll({
    attributes: ['course_code', 'student_studentnumber', 'semestercode', 'attainment_date'],
    where: {
      course_code: { [Op.in]: courseCodes },
      semestercode: { [Op.gte]: autumnSemester2017 },
      credittypecode: CreditTypeCode.PASSED,
    },
    raw: true,
  })

  const enrollments = await Enrollment.findAll({
    attributes: ['studentnumber', 'semestercode', 'course_code', 'enrollment_date_time', 'state'],
    where: {
      course_code: { [Op.in]: courseCodes },
      semestercode: { [Op.gte]: autumnSemester2017 },
      state: { [Op.in]: [EnrollmentState.ENROLLED, EnrollmentState.REJECTED] },
    },
    raw: true,
  })

  const studentList = new Set<string>()
  const attemptsByStudents = {} as Record<string, Attempt[]>

  credits.forEach(credit => {
    const studentNumber = credit.student_studentnumber
    studentList.add(studentNumber)
    if (!attemptsByStudents[studentNumber]) {
      attemptsByStudents[studentNumber] = []
    }
    attemptsByStudents[studentNumber].push({
      studentNumber,
      courseCode: credit.course_code,
      completed: true,
      date: credit.attainment_date,
      semestercode: credit.semestercode,
    })
  })

  enrollments.forEach(enrollment => {
    const studentNumber = enrollment.studentnumber
    if (!attemptsByStudents[studentNumber]) {
      attemptsByStudents[studentNumber] = []
    }
    studentList.add(studentNumber)
    if (
      attemptsByStudents[studentNumber].find(
        attempt =>
          !attempt.completed &&
          attempt.semestercode === enrollment.semestercode &&
          attempt.courseCode === enrollment.course_code
      )
    ) {
      return
    }
    attemptsByStudents[studentNumber].push({
      studentNumber,
      courseCode: enrollment.course_code,
      completed: false,
      date: enrollment.enrollment_date_time,
      semestercode: enrollment.semestercode,
      enrolled: enrollment.state === EnrollmentState.ENROLLED,
    })
  })

  const attemptsArray = [] as Attempt[]
  studentList.forEach(studentNumber => attemptsArray.push(...attemptsByStudents[studentNumber]))

  const unorderedTableData = await createArrayOfCourses(attemptsArray, courses)
  const tableData = orderBy(unorderedTableData, 'code')

  return { tableData }
}

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

  const yearlyPassedStudentByCoursePromises = makeYearlyPromises(yearRange, academicYear, 'passed', programmeCourses)
  const yearlyNotCompletedStudentByCoursePromises = makeYearlyPromises(
    yearRange,
    academicYear,
    'notCompleted',
    programmeCourses
  )
  const yearlyProgrammeStudentsPromises = makeYearlyPromises(
    yearRange,
    academicYear,
    'ownStudents',
    programmeCourses,
    studyProgramme
  )
  const yearlyStudentsWithoutStudyRightPromises = makeYearlyPromises(
    yearRange,
    academicYear,
    'withoutStudyRight',
    programmeCourses
  )
  const yearlyOtherProgrammeStudentsPromises = makeYearlyPromises(
    yearRange,
    academicYear,
    'otherStudents',
    programmeCourses,
    studyProgramme
  )
  const yearlyTransferStudentsPromises = makeYearlyPromises(
    yearRange,
    academicYear,
    'transfer',
    programmeCourses,
    studyProgramme
  )

  const [
    yearlyPassedStudentByCourse,
    yearlyNotCompletedStudentByCourse,
    yearlyProgrammeStudents,
    yearlyStudentsWithoutStudyRight,
    yearlyOtherProgrammeStudents,
    yearlyTransferStudents,
  ] = await Promise.all([
    Promise.all(yearlyPassedStudentByCoursePromises),
    Promise.all(yearlyNotCompletedStudentByCoursePromises),
    Promise.all(yearlyProgrammeStudentsPromises),
    Promise.all(yearlyStudentsWithoutStudyRightPromises),
    Promise.all(yearlyOtherProgrammeStudentsPromises),
    Promise.all(yearlyTransferStudentsPromises),
  ])

  let maxYear = 0
  const allCourses = [
    ...yearlyPassedStudentByCourse.flat(),
    ...yearlyNotCompletedStudentByCourse.flat(),
    ...yearlyProgrammeStudents.flat(),
    ...yearlyStudentsWithoutStudyRight.flat(),
    ...yearlyOtherProgrammeStudents.flat(),
    ...yearlyTransferStudents.flat(),
  ].reduce(
    (acc, curr) => {
      if (curr.year! > maxYear) {
        maxYear = curr.year!
      }
      if (!acc[curr.code]) {
        acc[curr.code] = {
          code: curr.code,
          name: curr.name,
          isStudyModule: curr.isStudyModule || false,
          years: {},
        }
      }

      if (!acc[curr.code].years[curr.year!]) {
        acc[curr.code].years[curr.year!] = {
          totalAllStudents: 0,
          totalPassed: 0,
          totalNotCompleted: 0,
          totalAllCredits: 0,
          totalProgrammeStudents: 0,
          totalProgrammeCredits: 0,
          totalOtherProgrammeStudents: 0,
          totalOtherProgrammeCredits: 0,
          totalWithoutStudyrightStudents: 0,
          totalWithoutStudyrightCredits: 0,
          totalTransferStudents: 0,
          totalTransferCredits: 0,
          isStudyModule: curr.isStudyModule,
        }
      }
      switch (curr.type) {
        case 'passed':
          acc[curr.code].years[curr.year!].totalPassed += curr.totalPassed
          acc[curr.code].years[curr.year!].totalAllStudents += acc[curr.code].years[curr.year!].totalPassed
          acc[curr.code].years[curr.year!].totalAllCredits += curr.totalAllCredits
          break
        case 'notCompleted':
          acc[curr.code].years[curr.year!].totalNotCompleted += curr.totalNotCompleted
          acc[curr.code].years[curr.year!].totalAllStudents += acc[curr.code].years[curr.year!].totalNotCompleted
          break
        case 'ownProgramme':
          acc[curr.code].years[curr.year!].totalProgrammeStudents += curr.totalProgrammeStudents
          acc[curr.code].years[curr.year!].totalProgrammeCredits += curr.totalProgrammeCredits
          break
        case 'otherProgramme':
          acc[curr.code].years[curr.year!].totalOtherProgrammeStudents += curr.totalOtherProgrammeStudents
          acc[curr.code].years[curr.year!].totalOtherProgrammeCredits += curr.totalOtherProgrammeCredits
          break
        case 'noStudyright':
          acc[curr.code].years[curr.year!].totalWithoutStudyrightStudents += curr.totalWithoutStudyrightStudents
          acc[curr.code].years[curr.year!].totalWithoutStudyrightCredits += curr.totalWithoutStudyrightCredits
          break
        case 'transfer':
          acc[curr.code].years[curr.year!].totalTransferStudents += curr.totalTransferStudents
          acc[curr.code].years[curr.year!].totalTransferCredits += curr.totalTransferCredits
          break
        default:
          break
      }
      return acc
    },
    {} as Record<string, Course>
  )
  const ayCourses = Object.keys(allCourses).filter(courseCode => courseCode.startsWith('AY'))
  const properties = [
    'totalAllStudents',
    'totalPassed',
    'totalNotCompleted',
    'totalAllCredits',
    'totalProgrammeStudents',
    'totalProgrammeCredits',
    'totalOtherProgrammeStudents',
    'totalOtherProgrammeCredits',
    'totalWithoutStudyrightStudents',
    'totalWithoutStudyrightCredits',
    'totalTransferCredits',
    'totalTransferStudents',
  ]
  ayCourses.forEach(ayCourse => {
    const openUniCourseCode = isOpenUniCourseCode(ayCourse)
    if (!openUniCourseCode) {
      return
    }
    const normCode = openUniCourseCode[1]

    if (allCourses[normCode]) {
      const mergedCourse = {} as Course
      mergedCourse.code = allCourses[normCode].code
      mergedCourse.name = allCourses[normCode].name
      mergedCourse.years = {}

      yearRange
        .filter(year => year <= maxYear)
        .forEach(year => {
          if (!allCourses[normCode].years[year]) {
            mergedCourse.years[year] = {
              totalAllStudents: 0,
              totalPassed: 0,
              totalNotCompleted: 0,
              totalAllCredits: 0,
              totalProgrammeStudents: 0,
              totalProgrammeCredits: 0,
              totalOtherProgrammeStudents: 0,
              totalOtherProgrammeCredits: 0,
              totalWithoutStudyrightStudents: 0,
              totalWithoutStudyrightCredits: 0,
              totalTransferCredits: 0,
              totalTransferStudents: 0,
            }
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
