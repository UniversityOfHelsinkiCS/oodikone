const { keyBy } = require('lodash')

const { getPassingSemester } = require('../../util/semester')
const { CourseStatsCounter } = require('../courses/course_stats_counter')
const { encrypt } = require('../encrypt')
const { dateMonthsFromNow, findCourses, findCourseEnrollments, parseCreditInfo, parseQueryParams } = require('./shared')
const { studentnumbersWithAllStudyrightElements } = require('./studentnumbersWithAllStudyrightElements')

const getStudentsAndCourses = async (params, selectedStudents, studentnumberlist, courseCodes) => {
  if (!studentnumberlist) {
    const { months, studyRights, startDate, endDate, exchangeStudents, nondegreeStudents, transferredStudents, tag } =
      params
    const studentnumbers =
      selectedStudents ||
      (await studentnumbersWithAllStudyrightElements({
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

    const allstudents = studentnumbers.reduce((numbers, num) => {
      numbers[num] = true
      return numbers
    }, {})
    const courses = await findCourses(studentnumbers, dateMonthsFromNow(startDate, months), courseCodes)
    const foundCourseCodes = Object.keys(keyBy(courses, 'code'))
    const filteredCourseCodes = courseCodes?.filter(code => !foundCourseCodes.includes(code))

    const courseEnrollements = await findCourseEnrollments(
      studentnumbers,
      dateMonthsFromNow(startDate, months),
      filteredCourseCodes
    )
    return [allstudents, courses, courseEnrollements]
  }
  const { months, startDate } = params
  const beforeDate = months && startDate ? dateMonthsFromNow(startDate, months) : new Date()
  const allstudents = studentnumberlist.reduce((numbers, num) => {
    numbers[num] = true
    return numbers
  }, {})
  const courses = await findCourses(studentnumberlist, beforeDate, courseCodes)
  const foundCourseCodes = Object.keys(keyBy(courses, 'code'))
  const filteredCourseCodes = courseCodes?.filter(code => !foundCourseCodes.includes(code))

  const courseEnrollements = await findCourseEnrollments(studentnumberlist, beforeDate, filteredCourseCodes)
  return [allstudents, courses, courseEnrollements]
}

const bottlenecksOf = async (query, studentnumberlist, encryptdata = false) => {
  const encryptStudentnumbers = bottlenecks => {
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
  const [[allstudents, courses, courseEnrollements], [, allCourses]] = await Promise.all([
    getStudentsAndCourses(params, query.selectedStudents, studentnumberlist, query.courses),
    getStudentsAndCourses(params, allStudentsByYears, null, query.courses),
  ])

  // Get the substitution codes for the fetch data by selscted students
  const substitutionCodes = Object.entries(courses).reduce(
    (res, [, obj]) => [...res, ...(obj?.substitutions || [])],
    []
  )
  const codes = Object.keys(keyBy(courses, 'code')).map(code => code)
  // Filter substitution courses for fetched courses -> by this we avoid the situation in which there is only
  // courses with old course codes. Frontend NEEDS in most cases the current course.
  const substitutionCourses = allCourses.filter(
    obj => substitutionCodes.includes(obj.code) && !codes.includes(obj.code)
  )
  const bottlenecks = {
    disciplines: {},
    coursetypes: {},
  }

  const stats = {}
  const startYear = parseInt(query.year, 10)
  const allstudentslength = Object.keys(allstudents).length
  let coursesToLoop = courses.concat(substitutionCourses)
  const codesList = coursesToLoop.map(course => course.code)
  // This fix problem when Enrolled no grade is chosen. The sql query for fetching
  // credits do not fetch enrollments if no credits found for selected students.
  // This and other sql query ensures that enrollments are added.
  const coursesOnlyWithEnrollments = courseEnrollements.filter(
    course => !codesList.includes(course.code) && course.enrollments
  )
  coursesToLoop = coursesToLoop.concat(coursesOnlyWithEnrollments)

  const coursesByCode = keyBy(coursesToLoop, 'code')
  for (const course of coursesToLoop) {
    const { course_type } = course
    let maincourse = course

    if (course.main_course_code && course.main_course_code !== course.code) {
      const newmain = coursesByCode[course.main_course_code]

      if (newmain) {
        maincourse = newmain
      }
    }

    if (!stats[maincourse.code]) {
      stats[maincourse.code] = new CourseStatsCounter(maincourse.code, maincourse.name, allstudentslength)
    }
    const coursestats = stats[maincourse.code]
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

    stats[maincourse.code] = coursestats
  }

  const allStats = Object.values(stats).map(coursestatistics => coursestatistics.getFinalStats())
  bottlenecks.coursestatistics = allStats.filter(course => course.stats.students > 0)
  bottlenecks.allStudents = allstudentslength

  if (encryptdata) encryptStudentnumbers(bottlenecks)

  return bottlenecks
}

module.exports = {
  bottlenecksOf,
}
