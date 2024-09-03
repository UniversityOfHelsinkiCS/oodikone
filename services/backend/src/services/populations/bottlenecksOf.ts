const { keyBy } = require('lodash')

const { getPassingSemester } = require('../../util/semester')
const { CourseStatsCounter } = require('../courses/courseStatsCounter')
const { encrypt } = require('../encrypt')
const { dateMonthsFromNow, findCourses, findCourseEnrollments, parseCreditInfo, parseQueryParams } = require('./shared')
const { getStudentNumbersWithAllStudyRightElements } = require('./studentNumbersWithAllElements')

const getStudentsAndCourses = async (params, selectedStudents, studentNumbers, courseCodes) => {
  if (!studentNumbers) {
    const { months, studyRights, startDate, endDate, exchangeStudents, nondegreeStudents, transferredStudents, tag } =
      params
    const studentnumbers =
      selectedStudents ||
      (await getStudentNumbersWithAllStudyRightElements({
        studyRights,
        startDate,
        endDate,
        exchangeStudents,
        nondegreeStudents,
        transferredOutStudents: transferredStudents,
        tag,
        transferredToStudents: true,
        graduatedStudents: true,
      }))

    const allStudents = studentnumbers.length
    const courses = await findCourses(studentnumbers, dateMonthsFromNow(startDate, months), courseCodes)
    const foundCourseCodes = Object.keys(keyBy(courses, 'code'))
    const filteredCourseCodes = courseCodes?.filter(code => !foundCourseCodes.includes(code))
    const courseEnrollments = await findCourseEnrollments(
      studentnumbers,
      dateMonthsFromNow(startDate, months),
      filteredCourseCodes
    )

    return [allStudents, courses, courseEnrollments]
  }

  const { months, startDate } = params
  const beforeDate = months && startDate ? dateMonthsFromNow(startDate, months) : new Date()
  const allStudents = studentNumbers.length
  const courses = await findCourses(studentNumbers, beforeDate, courseCodes)
  const foundCourseCodes = Object.keys(keyBy(courses, 'code'))
  const filteredCourseCodes = courseCodes?.filter(code => !foundCourseCodes.includes(code))
  const courseEnrollments = await findCourseEnrollments(studentNumbers, beforeDate, filteredCourseCodes)

  return [allStudents, courses, courseEnrollments]
}

const bottlenecksOf = async (query, studentNumbers, encryptData = false) => {
  const encryptStudentNumbers = bottlenecks => {
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
        (res, year) => [...res, ...query.selectedStudentsByYear[year]],
        []
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
    []
  )
  const codes = Object.keys(keyBy(courses, 'code')).map(code => code)
  // Filter substitution courses for fetched courses -> by this we avoid the situation in which there
  // are only courses with old course codes. Frontend NEEDS in most cases the current course.
  const substitutionCourses = allCourses.filter(
    course => substitutionCodes.includes(course.code) && !codes.includes(course.code)
  )
  const bottlenecks = {
    disciplines: {},
    coursetypes: {},
  }

  const stats = {}
  const startYear = parseInt(query.year, 10)
  let coursesToLoop = courses.concat(substitutionCourses)
  const courseCodes = coursesToLoop.map(course => course.code)

  // This fixes a problem when "Enrolled, no grade" is chosen. The SQL query for fetching
  // credits does not fetch enrollments if no credits are found for selected students.
  // This and other SQL query ensures that enrollments are added.
  const coursesOnlyWithEnrollments = courseEnrollements.filter(
    course => !courseCodes.includes(course.code) && course.enrollments
  )
  coursesToLoop = coursesToLoop.concat(coursesOnlyWithEnrollments)

  const coursesByCode = keyBy(coursesToLoop, 'code')
  for (const course of coursesToLoop) {
    const { course_type } = course
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
    coursestats.addCourseType(course_type.coursetypecode, course_type.name)
    coursestats.addCourseSubstitutions(course.substitutions)
    bottlenecks.coursetypes[course_type.coursetypecode] = course_type.name
    if (course.enrollments) {
      course.enrollments.forEach(({ studentnumber, state, enrollment_date_time }) => {
        if ((query?.selectedStudents && query?.selectedStudents.includes(studentnumber)) || !query?.selectedStudents) {
          const semester = getPassingSemester(startYear, enrollment_date_time)
          coursestats.markEnrollment(studentnumber, state, semester, enrollment_date_time)
        }
      })
    }
    if (course.credits) {
      course.credits.forEach(credit => {
        const { studentnumber, passingGrade, improvedGrade, failingGrade, grade, date } = parseCreditInfo(credit)
        if ((query?.selectedStudents && query?.selectedStudents.includes(studentnumber)) || !query?.selectedStudents) {
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

module.exports = {
  bottlenecksOf,
}
