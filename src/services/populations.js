const { Op } = require('sequelize')
const moment = require('moment')
const { Student, Credit, Course, sequelize, Studyright, StudyrightExtent, ElementDetails, Discipline, CourseType, SemesterEnrollment, Semester, Transfers, StudyrightElement } = require('../models')
const { getAllDuplicates } = require('./courses')

const enrolmentDates = () => {
  const query = 'SELECT DISTINCT s.dateOfUniversityEnrollment as date FROM Student s'
  return sequelize.query(query, { type: sequelize.QueryTypes.SELECT }
  )
}

const universityEnrolmentDates = async () => {
  const [result] = await enrolmentDates()
  return result.map(r => r.date).filter(d => d).sort()
}

const semesterStart = {
  SPRING: '01-01',
  FALL: '07-31'
}

const semesterEnd = {
  SPRING: '07-31',
  FALL: '12-31'
}

const formatStudentForPopulationStatistics = ({ firstnames, lastname, studentnumber, dateofuniversityenrollment, creditcount, matriculationexamination, gender, credits, abbreviatedname, email, studyrights, semester_enrollments, transfers, updatedAt, createdAt }, startDate, endDate) => {

  const toCourse = ({ grade, attainment_date, credits, course, credittypecode }) => {
    course = course.get()
    return {
      course: {
        code: course.code,
        name: course.name,
        coursetypecode: course.coursetypecode
      },
      date: attainment_date,
      passed: Credit.passed({ credittypecode }),
      grade,
      credits,
      isStudyModuleCredit: course.is_study_module
    }
  }

  studyrights = studyrights === undefined ? [] : studyrights.map(({ studyrightid, highlevelname, startdate, enddate, extentcode, graduated, graduation_date, studyright_elements }) => ({
    studyrightid,
    highlevelname,
    extentcode,
    startdate,
    graduationDate: graduation_date,
    studyrightElements: studyright_elements,
    enddate,
    graduated: Boolean(graduated)
  }))

  semester_enrollments = semester_enrollments || []
  const semesterenrollments = semester_enrollments.map(({ semestercode, enrollmenttype }) => ({ semestercode, enrollmenttype }))

  const courseByDate = (a, b) => {
    return moment(a.attainment_date).isSameOrBefore(b.attainment_date) ? -1 : 1
  }

  if (credits === undefined) {
    credits = []
  }

  const started = dateofuniversityenrollment

  return {
    firstnames,
    lastname,
    studyrights,
    started,
    studentNumber: studentnumber,
    credits: creditcount || 0,
    courses: credits.sort(courseByDate).map(toCourse),
    name: abbreviatedname,
    transfers: transfers || [],
    matriculationexamination,
    gender,
    email,
    semesterenrollments,
    updatedAt: updatedAt || createdAt,
    tags: [],
    studyrightStart: startDate,
    starting: moment(started).isBetween(startDate, endDate, null, '[]')
  }
}

const dateMonthsFromNow = (date, months) => moment(date).add(months, 'months').format('YYYY-MM-DD')

const getStudentsIncludeCoursesBetween = async (studentnumbers, startDate, endDate) => {
  const students = await Student.findAll({
    attributes: ['firstnames', 'lastname', 'studentnumber', 'dateofuniversityenrollment', 'creditcount', 'matriculationexamination', 'abbreviatedname', 'email', 'updatedAt'],
    include: [
      {
        model: Credit,
        attributes: ['grade', 'credits', 'credittypecode', 'attainment_date', 'student_studentnumber'],
        separate: true,
        include: [
          {
            model: Course,
            required: true,
            attributes: ['code', 'name', 'coursetypecode']
          }
        ],
        where: {
          student_studentnumber: {
            [Op.in]: studentnumbers
          },
          attainment_date: {
            [Op.between]: [startDate, endDate]
          }
        }
      },
      {
        model: Transfers,
        attributes: ['transferdate'],
        include: [
          {
            model: ElementDetails,
            required: true,
            attributes: ['code', 'name', 'type'],
            as: 'source'
          },
          {
            model: ElementDetails,
            required: true,
            attributes: ['code', 'name', 'type'],
            as: 'target'
          }
        ]
      },
      {
        model: Studyright,
        required: true,
        attributes: ['studyrightid', 'startdate', 'highlevelname', 'extentcode', 'graduated'],
        include: {
          model: StudyrightExtent,
          required: true,
          attributes: ['extentcode', 'name']
        }
      },
      {
        model: SemesterEnrollment,
        attributes: ['enrollmenttype', 'studentnumber', 'semestercode'],
        separate: true,
        include: {
          model: Semester,
          attributes: ['semestercode', 'name', 'startdate', 'enddate'],
          required: true,
          where: {
            startdate: {
              [Op.between]: [startDate, endDate]
            },
            enddate: {
              [Op.between]: [startDate, endDate]
            }
          }
        }
      }
    ],
    where: {
      studentnumber: {
        [Op.in]: studentnumbers
      }
    }
  })
  return students
}

const count = (column, count, distinct = false) => {
  const countable = !distinct ? sequelize.col(column) : sequelize.fn('DISTINCT', sequelize.col(column))
  return sequelize.where(
    sequelize.fn('COUNT', countable), {
      [Op.eq]: count
    }
  )
}

const studentnumbersWithAllStudyrightElementsAndCreditsBetween = async (studyRights, startDate, endDate, months) => {
  const creditBeforeDate = dateMonthsFromNow(startDate, months)
  const students = await Student.findAll({
    attributes: ['studentnumber'],
    include: [
      {
        model: Credit,
        attributes: [],
        required: true,
        where: {
          attainment_date: {
            [Op.between]: [startDate, creditBeforeDate]
          }
        }
      },
      {
        model: StudyrightElement,
        attributes: [],
        required: true,
        where: {
          code: {
            [Op.in]: studyRights
          },
          startdate: {
            [Op.between]: [startDate, endDate]
          }
        }
      },
    ],
    group: [
      sequelize.col('student.studentnumber')
    ],
    having: count('studyright_elements.code', studyRights.length, true)
  })
  return students.map(s => s.studentnumber)
}

const parseQueryParams = query => {
  const { semester, year, studyRights, months } = query
  const startDate = `${year}-${semesterStart[semester]}`
  const endDate = `${year}-${semesterEnd[semester]}`
  return {
    studyRights,
    months,
    startDate,
    endDate
  }
}

const formatStudentsForApi = (students, startDate, endDate) => {
  const result = students.reduce((stats, student) => {
    student.transfers.forEach(transfer => {
      const target = stats.transfers.targets[transfer.target.code] || { name: transfer.target.name, sources: {} }
      const source = stats.transfers.sources[transfer.source.code] || { name: transfer.source.name, targets: {} }
      target.sources[transfer.source.code] = { name: transfer.source.name }
      source.targets[transfer.target.code] = { name: transfer.target.name }
      stats.transfers.targets[transfer.target.code] = target
      stats.transfers.sources[transfer.source.code] = source
    })
    student.studyrights.forEach(studyright => {
      if (studyright.studyright_extent) {
        const { extentcode, name } = studyright.studyright_extent
        stats.extents[extentcode] = { extentcode, name }
      }
    })
    student.semester_enrollments.forEach(({ semestercode, semester }) => {
      stats.semesters[semestercode] = semester
    })
    stats.students.push(formatStudentForPopulationStatistics(student, startDate, endDate))
    return stats
  }, {
      students: [],
      extents: {},
      semesters: {},
      transfers: {
        targets: {},
        sources: {}
      }
    })
  return {
    students: result.students,
    transfers: result.transfers,
    extents: Object.values(result.extents),
    semesters: Object.values(result.semesters)
  }
}

const optimizedStatisticsOf = async (query) => {
  if (semesterStart[query.semester] === undefined) {
    return { error: 'Semester should be either SPRING OR FALL' }
  }
  const { studyRights, semester, year, months } = query
  const startDate = `${year}-${semesterStart[semester]}`
  const endDate = `${year}-${semesterEnd[semester]}`
  const studentnumbers = await studentnumbersWithAllStudyrightElementsAndCreditsBetween(studyRights, startDate, endDate, months)
  const students = await getStudentsIncludeCoursesBetween(studentnumbers, startDate, dateMonthsFromNow(startDate, months))
  return formatStudentsForApi(students, startDate, endDate)
}

const unifyOpenUniversity = (code) => {
  if (code[0] === 'A') {
    return code.substring(code[1] === 'Y' ? 2 : 1)
  }
  return code
}

const getUnifiedCode = (code, codeduplicates) => {
  const formattedcode = unifyOpenUniversity(code)
  const unifiedcodes = codeduplicates[formattedcode]
  return !unifiedcodes ? formattedcode : unifiedcodes.main
}

const percentageOf = (num, denom) => Number((100 * num / denom).toFixed(2))

const findCourses = (studentnumbers, beforeDate) => {
  return Course.findAll({
    attributes: ['code', 'name', 'coursetypecode'],
    include: [
      {
        required: true,
        model: Credit,
        attributes: ['grade', 'student_studentnumber', 'credittypecode', 'attainment_date', 'course_code'],
        where: {
          student_studentnumber: {
            [Op.in]: studentnumbers
          },
          attainment_date: {
            [Op.lt]: beforeDate
          }
        },
        order: 'attainment_date'
      },
      {
        model: Discipline
      },
      {
        model: CourseType,
        required: true
      }
    ]
  })
}

const createEmptyStatsObject = (code, name, allstudents) => ({
  course: {
    code,
    name,
    disciplines: {},
    coursetypes: {}
  },
  students: {
    all: {},
    passed: {},
    failed: {},
    retryPassed: {},
    failedMany: {},
    improvedPassedGrade: {},
    notParticipated: allstudents,
    notParticipatedOrFailed: allstudents
  },
  stats: {
    students: 0,
    passed: 0,
    failed: 0,
    failedMany: 0,
    retryPassed: 0,
    attempts: 0,
    improvedPassedGrade: 0,
    percentage: undefined,
    passedOfPopulation: undefined,
    triedOfPopulation: undefined
  },
  grades: {
  }
})

const parseCreditInfo = credit => ({
  studentnumber: credit.student_studentnumber,
  grade: credit.grade,
  passingGrade: Credit.passed(credit),
  failingGrade: Credit.failed(credit),
  improvedGrade: Credit.improved(credit)
})

const lengthOf = obj => Object.keys(obj).length

const bottlenecksOf = async (query) => {
  if (semesterStart[query.semester] === undefined) {
    return { error: 'Semester should be either SPRING OR FALL' }
  }
  const { studyRights, startDate, endDate, months } = parseQueryParams(query)
  const bottlenecks = {
    disciplines: {},
    coursetypes: {}
  }
  const codeduplicates = await getAllDuplicates()
  const studentnumbers = await studentnumbersWithAllStudyrightElementsAndCreditsBetween(studyRights, startDate, endDate, months)
  const courses = await findCourses(studentnumbers, dateMonthsFromNow(startDate, months))
  const allstudents = studentnumbers.reduce((numbers, num) => ({ ...numbers, [num]: true }), {})
  const allcoursestatistics = courses.reduce((coursestatistics, course) => {
    const { code, name, disciplines, course_type } = course
    const unifiedcode = getUnifiedCode(code, codeduplicates)
    const coursestats = coursestatistics[unifiedcode] || createEmptyStatsObject(code, name, allstudents)
    const { students, grades, stats } = coursestats
    coursestats.course.coursetypes[course_type.coursetypecode] = course_type.name
    bottlenecks.coursetypes[course_type.coursetypecode] = course_type.name
    disciplines.forEach(({ discipline_id, name }) => {
      coursestats.course.disciplines[discipline_id] = name
      bottlenecks.disciplines[discipline_id] = name
    })
    course.credits.forEach(credit => {
      const { studentnumber, passingGrade, improvedGrade, failingGrade, grade } = parseCreditInfo(credit)
      stats.attempts += 1
      const gradecount = grades[grade] ? grades[grade].count || 0 : 0
      grades[grade] = { count: gradecount + 1, status: { passingGrade, improvedGrade, failingGrade } }
      students.all[studentnumber] = true
      const failedBefore = students.failed[studentnumber] !== undefined
      const passedBefore = students.passed[studentnumber] !== undefined
      delete students.notParticipated[studentnumber]
      if (passingGrade === true) {
        delete students.notParticipatedOrFailed[studentnumber]
        students.passed[studentnumber] = true
        if (failedBefore === true) {
          delete students.failed[studentnumber]
          students.retryPassed[studentnumber] = true
        }
      }
      if (improvedGrade === true) {
        students.improvedPassedGrade[studentnumber] = true
      }
      if (failingGrade === true && passedBefore === false) {
        students.failed[studentnumber] = true
        if (failedBefore === true) {
          students.failedMany[studentnumber] = true
        }
      }
      if (failingGrade && passedBefore) {
        students.retryPassed[studentnumber] = true
      }
    })
    coursestatistics[unifiedcode] = coursestats
    return coursestatistics
  }, {})
  bottlenecks.coursestatistics = Object.values(allcoursestatistics).map(coursestatistics => {
    const { stats, students } = coursestatistics
    stats.students = lengthOf(students.all)
    stats.passed = lengthOf(students.passed)
    stats.failed = lengthOf(students.failed)
    stats.failedMany = lengthOf(students.failedMany)
    stats.retryPassed = lengthOf(students.retryPassed)
    stats.improvedPassedGrade = lengthOf(students.improvedPassedGrade)
    stats.percentage = percentageOf(stats.passed, stats.students)
    stats.passedOfPopulation = percentageOf(stats.passed, studentnumbers.length)
    stats.triedOfPopulation = percentageOf(stats.students, studentnumbers.length)
    stats.perStudent = stats.attempts / (stats.passed + stats.failed)
    return coursestatistics
  })
  return bottlenecks
}

module.exports = {
  universityEnrolmentDates,
  optimizedStatisticsOf,
  bottlenecksOf
}