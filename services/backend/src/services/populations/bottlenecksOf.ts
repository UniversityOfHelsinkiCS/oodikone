import { keyBy } from 'lodash'

import { getPassingSemester } from '../../util/semester'
import { CourseStatistics, CourseStatsCounter } from '../courses/courseStatsCounter'
import { encrypt } from '../encrypt'
import {
  CoursesQueryResult,
  dateMonthsFromNow,
  EnrollmentsQueryResult,
  findCourses,
  findCourseEnrollments,
  Params,
  parseCreditInfo,
  parseQueryParams,
  Query,
} from './shared'
import { getStudentNumbersWithAllStudyRightElements } from './studentNumbersWithAllElements'

const getStudentsAndCourses = async (
  params: Params,
  selectedStudents: string[] | undefined,
  studentNumbers: string[] | null,
  courseCodes: string[] | undefined
): Promise<[number, CoursesQueryResult, EnrollmentsQueryResult]> => {
  const { months, studyRights, startDate, endDate, exchangeStudents, nondegreeStudents, transferredStudents } = params

  const studentnumbers =
    studentNumbers ??
    selectedStudents ??
    (await getStudentNumbersWithAllStudyRightElements({
      studyRights,
      startDate,
      endDate,
      exchangeStudents,
      nondegreeStudents,
      transferredOutStudents: transferredStudents,
    }))

  const allStudents = studentnumbers.length

  const beforeDate = months && startDate ? dateMonthsFromNow(startDate, months) : new Date()
  const courses = !studentNumbers
    ? await findCourses(studentnumbers, dateMonthsFromNow(startDate, months), courseCodes)
    : await findCourses(studentnumbers, beforeDate, courseCodes)

  const foundCourseCodes = [...new Set(courses.map(({ code }) => code))].toSorted()
  const filteredCourseCodes = courseCodes?.filter(code => !foundCourseCodes.includes(code))
  const courseEnrollments = filteredCourseCodes?.length
    ? !studentNumbers
      ? await findCourseEnrollments(studentnumbers, dateMonthsFromNow(startDate, months), filteredCourseCodes)
      : await findCourseEnrollments(studentnumbers, beforeDate, filteredCourseCodes)
    : []

  return [allStudents, courses, courseEnrollments]
}

type Bottlenecks = {
  coursestatistics: CourseStatistics[]
  allStudents: number
}

export const bottlenecksOf = async (query: Query, studentNumbers: string[] | null, encryptData = false) => {
  const encryptStudentNumbers = (bottlenecks: Bottlenecks) => {
    for (const course of Object.keys(bottlenecks.coursestatistics)) {
      const encryptedStudentStats = {}
      for (const data of Object.keys(bottlenecks.coursestatistics[course].students)) {
        encryptedStudentStats[data] = {}
        const studentnumbers = Object.keys(bottlenecks.coursestatistics[course].students[data])
        studentnumbers.forEach(studentnumber => {
          encryptedStudentStats[data][encrypt(studentnumber).encryptedData] =
            bottlenecks.coursestatistics[course].students[data][studentnumber]
        })
      }
      bottlenecks.coursestatistics[course].students = encryptedStudentStats
    }
  }

  const params = parseQueryParams(query)
  const allStudentsByYears = query?.selectedStudentsByYear
    ? Object.keys(query.selectedStudentsByYear).reduce(
        (res, year) => [...res, ...query.selectedStudentsByYear![year]],
        [] as string[]
      )
    : []

  // To fix failed and enrolled, no grade filter options some not so clean and nice solutions were added
  // Get the data with actual 1. courses and filtered students. 2. all students by year, if provided.
  const [[allStudents, courses, courseEnrollements], [, allCourses]] = await Promise.all([
    getStudentsAndCourses(params, query.selectedStudents, studentNumbers, query.courses),
    getStudentsAndCourses(params, allStudentsByYears, null, query.courses),
  ])

  // Get the substitution codes for the fetch data by selected students
  const substitutionCodes = Object.entries(courses).reduce(
    (codes, [, course]) => [...codes, ...(course?.substitutions || [])],
    [] as string[]
  )
  const codes = Object.keys(keyBy(courses, 'code')).map(code => code)
  // Filter substitution courses for fetched courses -> by this we avoid the situation in which there
  // are only courses with old course codes. Frontend NEEDS in most cases the current course.
  const substitutionCourses = allCourses.filter(
    course => substitutionCodes.includes(course.code) && !codes.includes(course.code)
  )
  const bottlenecks: Bottlenecks = {
    coursestatistics: [],
    allStudents: 0,
  }

  const stats = {} as Record<string, CourseStatsCounter>
  const startYear = parseInt(query.year, 10)
  let coursesToLoop: Array<EnrollmentsQueryResult[number] | CoursesQueryResult[number]> =
    courses.concat(substitutionCourses)
  const courseCodes = coursesToLoop.map(course => course.code)

  // This fixes a problem when "Enrolled, no grade" is chosen. The SQL query for fetching
  // credits does not fetch enrollments if no credits are found for selected students.
  // This and other SQL query ensures that enrollments are added.
  const coursesOnlyWithEnrollments = courseEnrollements.filter(course => !courseCodes.includes(course.code))
  coursesToLoop = coursesToLoop.concat(coursesOnlyWithEnrollments)

  const coursesByCode = keyBy(coursesToLoop, 'code')
  for (const course of coursesToLoop) {
    let mainCourse = course

    if (course.main_course_code && course.main_course_code !== course.code) {
      const newMainCourse = coursesByCode[course.main_course_code]
      if (newMainCourse) {
        mainCourse = newMainCourse
      }
    }

    if (!stats[mainCourse.code]) {
      stats[mainCourse.code] = new CourseStatsCounter(mainCourse.code, mainCourse.name, allStudents)
    }

    const coursestats = stats[mainCourse.code]
    coursestats.addCourseSubstitutions(course.substitutions)
    if (course.enrollments) {
      course.enrollments.forEach(({ studentnumber, state, enrollment_date_time }) => {
        if (query?.selectedStudents?.includes(studentnumber) || !query?.selectedStudents) {
          const semester = getPassingSemester(startYear, enrollment_date_time)
          coursestats.markEnrollment(studentnumber, state, semester)
        }
      })
    }
    if ('credits' in course) {
      course.credits?.forEach(credit => {
        const { studentnumber, passingGrade, improvedGrade, failingGrade, grade, date } = parseCreditInfo(credit)
        if (query?.selectedStudents?.includes(studentnumber) || !query?.selectedStudents) {
          const semester = getPassingSemester(startYear, date)
          coursestats.markCredit(studentnumber, grade, passingGrade, failingGrade, improvedGrade, semester)
        }
      })
    }

    stats[mainCourse.code] = coursestats
  }

  bottlenecks.coursestatistics = Object.values(stats).map(coursestatistics => coursestatistics.getFinalStats())
  bottlenecks.allStudents = allStudents

  if (encryptData) {
    encryptStudentNumbers(bottlenecks)
  }

  return bottlenecks
}
