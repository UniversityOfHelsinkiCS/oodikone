const { Op } = require('sequelize')
const moment = require('moment')
const { orderBy } = require('lodash')
const { Student, Credit, Course, sequelize, Studyright, StudyrightExtent, ElementDetails, Discipline, CourseType, SemesterEnrollment, Semester, Transfers, StudyrightElement } = require('../models')
const { getAllDuplicates, byName } = require('./courses')
const { CourseStatsCounter } = require('./course_stats_counter')

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

  const toCourse = ({ grade, attainment_date, credits, course, credittypecode, isStudyModule }) => {
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
      isStudyModuleCredit: isStudyModule
    }
  }

  studyrights = studyrights === undefined ? [] : studyrights.map(({ studyrightid, highlevelname, startdate, canceldate, extentcode, graduated, graduation_date, studyright_elements, prioritycode }) => ({
    studyrightid,
    highlevelname,
    extentcode,
    startdate,
    graduationDate: graduation_date,
    studyrightElements: studyright_elements,
    canceldate,
    graduated: Boolean(graduated),
    prioritycode
  }))

  semester_enrollments = semester_enrollments || []
  const semesterenrollments = semester_enrollments.map(({ semestercode, enrollmenttype, enrollment_date }) => ({ semestercode, enrollmenttype, enrollmentdate: enrollment_date }))

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
        attributes: ['grade', 'credits', 'credittypecode', 'attainment_date', 'student_studentnumber', 'isStudyModule'],
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
        attributes: ['studyrightid', 'startdate', 'highlevelname', 'extentcode', 'graduated', 'canceldate', 'prioritycode'],
        include: [{
          model: StudyrightExtent,
          required: true,
          attributes: ['extentcode', 'name']
        },
        {
          model: StudyrightElement,
          required: true,
          include: {
            model: ElementDetails
          }
        }
        ]
      },
      {
        model: SemesterEnrollment,
        attributes: ['enrollmenttype', 'studentnumber', 'semestercode', 'enrollment_date'],
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

const studentnumbersWithAllStudyrightElements = async (studyRights, startDate, endDate) => {
  const students = await Student.findAll({
    attributes: ['studentnumber'],
    include: [
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
  const { semesters, year, studyRights, months } = query
  const startDate = semesters.includes('FALL') ? `${year}-${semesterStart[semesters.find(s => s === 'FALL')]}` : `${moment(year, 'YYYY').add(1, 'years').format('YYYY')}-${semesterStart[semesters.find(s => s === 'SPRING')]}`
  const endDate = semesters.includes('SPRING') ? `${moment(year, 'YYYY').add(1, 'years').format('YYYY')}-${semesterEnd[semesters.find(s => s === 'SPRING')]}` : `${year}-${semesterEnd[semesters.find(s => s === 'FALL')]}`
  return {
    studyRights,
    months,
    startDate,
    endDate
  }
}

const formatStudentsForApi = async (students, startDate, endDate) => {
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
        studyright.studyright_elements.map(element => {
          if (element.element_detail && element.element_detail.type === 10) {
            if (!stats.studyrights.degrees.map(d => d.code).includes(element.code)) {
              stats.studyrights.degrees = [...stats.studyrights.degrees, { code: element.code, name: element.element_detail.name }]
            }
          }
          if (element.element_detail && element.element_detail.type === 20) {
            if (!stats.studyrights.programmes.map(d => d.code).includes(element.code)) {
              stats.studyrights.programmes = [...stats.studyrights.programmes, { code: element.code, name: element.element_detail.name }]
            }
          }
        })
      }
    })
    student.semester_enrollments.forEach(({ semestercode, semester }) => {
      stats.semesters[semestercode] = semester
    })
    stats.students.push(formatStudentForPopulationStatistics(student, startDate, endDate))
    return stats
  },{
    students: [],
    extents: {},
    semesters: {},
    transfers: {
      targets: {},
      sources: {}
    },
    studyrights: {
      degrees: [],
      programmes: []
    }
  })
  return {
    students: result.students,
    transfers: result.transfers,
    extents: Object.values(result.extents),
    semesters: Object.values(result.semesters),
    studyrights: result.studyrights
  }
}

const optimizedStatisticsOf = async (query) => {
  if (!query.semesters.map(semester => semester === 'FALL' || semester === 'SPRING').every(e => e === true)) {
    return { error: 'Semester should be either SPRING OR FALL' }
  }
  const { studyRights, startDate, endDate, months } = parseQueryParams(query)

  const studentnumbers = await studentnumbersWithAllStudyrightElements(studyRights, startDate, endDate)
  const students = await getStudentsIncludeCoursesBetween(studentnumbers, startDate, dateMonthsFromNow(startDate, months))

  const studentsWithCombinedOpenUniCredits = await Promise.all(students.map(async st => {
    const credits = await Promise.all(st.credits.map(async cr => {
      if (cr.course.name.fi && cr.course.name.fi.includes('Avoin yo:')) {
        const courses = await byName(cr.course.name.fi.split(': ')[1], 'fi')
        const theOne = courses.length > 0 ? orderBy(courses, ['date'], ['desc'])[0] : cr.course
        cr.course.name = theOne.name
        cr.course.code = theOne.code

      }
      return cr
    }))
    st.credits = credits
    return st
  }
  ))

  const formattedStudents = await formatStudentsForApi(studentsWithCombinedOpenUniCredits, startDate, endDate)
  return formattedStudents
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

const parseCreditInfo = credit => ({
  studentnumber: credit.student_studentnumber,
  grade: credit.grade,
  passingGrade: Credit.passed(credit),
  failingGrade: Credit.failed(credit),
  improvedGrade: Credit.improved(credit)
})

const bottlenecksOf = async (query) => {
  if (!query.semesters.map(semester => semester === 'FALL' || semester === 'SPRING').every(e => e === true)) {
    return { error: 'Semester should be either SPRING OR FALL' }
  }
  const { studyRights, startDate, endDate, months } = parseQueryParams(query)
  const bottlenecks = {
    disciplines: {},
    coursetypes: {}
  }
  const codeduplicates = await getAllDuplicates()
  const studentnumbers = await studentnumbersWithAllStudyrightElements(studyRights, startDate, endDate)
  const allstudents = studentnumbers.reduce((numbers, num) => ({ ...numbers, [num]: true }), {})
  const courses = await findCourses(studentnumbers, dateMonthsFromNow(startDate, months))
  const allcoursestatistics = await courses.reduce(async (coursestatistics, course) => {
    const stats = await coursestatistics
    let { code, name, disciplines, course_type } = course
    if (name.fi && name.fi.includes('Avoin yo:')) {
      const courses = await byName(name.fi.split(': ')[1], 'fi')
      const theOne = courses.length > 0 ? orderBy(courses, ['date'], ['desc'])[0] : { name, code }
      code = theOne.code
      name = theOne.name
    }
    const unifiedcode = getUnifiedCode(code, codeduplicates)
    const coursestats = stats[unifiedcode] || new CourseStatsCounter(code, name, allstudents)
    coursestats.addCourseType(course_type.coursetypecode, course_type.name)
    bottlenecks.coursetypes[course_type.coursetypecode] = course_type.name
    disciplines.forEach(({ discipline_id, name }) => {
      coursestats.addCourseDiscipline(discipline_id, name)
      bottlenecks.disciplines[discipline_id] = name
    })
    course.credits.forEach(credit => {
      const { studentnumber, passingGrade, improvedGrade, failingGrade, grade } = parseCreditInfo(credit)
      coursestats.markCredit(studentnumber, grade, passingGrade, failingGrade, improvedGrade)
    })
    stats[unifiedcode] = coursestats
    return stats
  }, Promise.resolve({}))
  bottlenecks.coursestatistics = Object.values(allcoursestatistics).map(coursestatistics => coursestatistics.getFinalStats())
  return bottlenecks
}

module.exports = {
  universityEnrolmentDates,
  optimizedStatisticsOf,
  bottlenecksOf
}