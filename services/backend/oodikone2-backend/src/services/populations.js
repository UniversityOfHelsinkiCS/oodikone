const { Op } = require('sequelize')
const moment = require('moment')
const _ = require('lodash')

const {
  Student,
  Credit,
  Course,
  sequelize,
  Studyright,
  StudyrightExtent,
  ElementDetails,
  Discipline,
  CourseType,
  SemesterEnrollment,
  Semester,
  Transfers,
  StudyrightElement
} = require('../models')
const { Tag, TagStudent } = require('../models/models_kone')
const { getCodeToMainCourseMap, unifyOpenUniversity } = require('./courses')
const { CourseStatsCounter } = require('./course_stats_counter')
const { getPassingSemester, semesterEnd, semesterStart } = require('../util/semester')

const enrolmentDates = () => {
  const query = 'SELECT DISTINCT s.dateOfUniversityEnrollment as date FROM Student s'
  return sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
}

const universityEnrolmentDates = async () => {
  const [result] = await enrolmentDates()
  return result
    .map(r => r.date)
    .filter(d => d)
    .sort()
}

const formatStudentForPopulationStatistics = (
  {
    firstnames,
    lastname,
    studentnumber,
    dateofuniversityenrollment,
    creditcount,
    matriculationexamination,
    credits,
    abbreviatedname,
    email,
    studyrights,
    semester_enrollments,
    transfers,
    updatedAt,
    createdAt,
    gender_code,
    gender_fi,
    gender_sv,
    gender_en,
    tags
  },
  startDate,
  endDate,
  startDateMoment,
  endDateMoment
) => {
  const toCourse = ({ grade, attainment_date, credits, course, credittypecode, isStudyModule }) => {
    course = course.get()

    const attainment_date_normailized = moment(attainment_date).isBefore(startDateMoment)
      ? startDateMoment
          .clone()
          .add(1, 'day')
          .toISOString()
      : attainment_date

    return {
      course: {
        code: course.code,
        name: course.name,
        coursetypecode: course.coursetypecode
      },
      date: attainment_date_normailized,
      passed: Credit.passed({ credittypecode }),
      grade,
      credits,
      isStudyModuleCredit: isStudyModule
    }
  }

  studyrights =
    studyrights === undefined
      ? []
      : studyrights.map(
          ({
            studyrightid,
            highlevelname,
            startdate,
            canceldate,
            extentcode,
            graduated,
            graduation_date,
            studyright_elements,
            prioritycode
          }) => ({
            studyrightid,
            highlevelname,
            extentcode,
            startdate,
            graduationDate: graduation_date,
            studyrightElements: studyright_elements,
            canceldate,
            graduated: Boolean(graduated),
            prioritycode
          })
        )

  semester_enrollments = semester_enrollments || []
  const semesterenrollments = semester_enrollments.map(({ semestercode, enrollmenttype, enrollment_date }) => ({
    semestercode,
    enrollmenttype,
    enrollmentdate: enrollment_date
  }))

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
    courses: _.sortBy(credits, 'attainment_date').map(toCourse),
    name: abbreviatedname,
    transfers: transfers || [],
    matriculationexamination,
    gender_code,
    gender: { gender_en, gender_fi, gender_sv },
    email,
    semesterenrollments,
    updatedAt: updatedAt || createdAt,
    tags: tags || [],
    studyrightStart: startDate,
    starting: moment(started).isBetween(startDateMoment, endDateMoment, null, '[]')
  }
}

const dateMonthsFromNow = (date, months) =>
  moment(date)
    .add(months, 'months')
    .format('YYYY-MM-DD')

const getStudentsIncludeCoursesBetween = async (studentnumbers, startDate, endDate, studyright, tag) => {
  const attainmentDateFrom = tag ? moment(startDate).year(tag.year) : startDate
  const creditsOfStudentOther = {
    attainment_date: {
      [Op.between]: [attainmentDateFrom, endDate]
    }
  }

  // takes into accout possible progress tests taken earlier than the start date
  const creditsOfStudentLaakis = {
    student_studentnumber: {
      [Op.in]: studentnumbers
    },
    [Op.or]: [
      {
        attainment_date: {
          [Op.between]: [attainmentDateFrom, endDate]
        }
      },
      {
        course_code: {
          [Op.in]: ['375063', '339101']
        }
      }
    ]
  }

  const creditsOfStudent = ['320001', 'MH30_001'].includes(studyright[0])
    ? creditsOfStudentLaakis
    : creditsOfStudentOther

  const students = await Student.findAll({
    attributes: [
      'firstnames',
      'lastname',
      'studentnumber',
      'home_country_en',
      'dateofuniversityenrollment',
      'creditcount',
      'matriculationexamination',
      'abbreviatedname',
      'email',
      'updatedAt',
      'gender_code',
      'gender_fi',
      'gender_sv',
      'gender_en'
    ],
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
        where: creditsOfStudent
      },
      {
        model: Transfers,
        attributes: ['transferdate'],
        separate: true,
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
        attributes: [
          'studyrightid',
          'startdate',
          'highlevelname',
          'extentcode',
          'graduated',
          'canceldate',
          'prioritycode'
        ],
        separate: true,
        include: [
          {
            model: StudyrightExtent,
            required: true,
            attributes: ['extentcode', 'name']
          },
          {
            model: StudyrightElement,
            required: true,
            attributes: ['id', 'startdate', 'enddate', 'studyrightid', 'code', 'studentnumber'],
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

  const studentTags = await TagStudent.findAll({
    attributes: ['tag_id', 'studentnumber'],
    include: [
      {
        model: Tag,
        attributes: ['tag_id', 'tagname', 'personal_user_id']
      }
    ],
    where: {
      studentnumber: {
        [Op.in]: studentnumbers
      }
    }
  })
  const studentNumberToTags = studentTags.reduce((acc, t) => {
    acc[t.studentnumber] = acc[t.studentnumber] || []
    acc[t.studentnumber].push(t)
    return acc
  }, {})

  students.forEach(student => {
    student.tags = studentNumberToTags[student.studentnumber] || []
  })

  if (tag) return students.filter(student => student.tags.some(t => t.tag_id === tag.tag_id))
  return students
}

const count = (column, count, distinct = false) => {
  const countable = !distinct ? sequelize.col(column) : sequelize.fn('DISTINCT', sequelize.col(column))
  return sequelize.where(sequelize.fn('COUNT', countable), {
    [Op.eq]: count
  })
}

const getEarliestYear = async (studentnumberlist, studyRights) => {
  const startdates = await StudyrightElement.findAll({
    attributes: ['startdate'],
    where: {
      studentnumber: {
        [Op.in]: studentnumberlist
      },
      code: {
        [Op.eq]: studyRights.programme
      }
    }
  })
  const startyears = startdates.map(l => Number(new Date(l.startdate).getFullYear()))
  return Math.min(...startyears)
}

const studentnumbersWithAllStudyrightElements = async (
  studyRights,
  startDate,
  endDate,
  exchangeStudents,
  cancelledStudents,
  nondegreeStudents,
  tag
) => {
  // eslint-disable-line

  const filteredExtents = []
  let studyrightWhere = {
    extentcode: {
      [Op.notIn]: filteredExtents
    }
  }
  if (!exchangeStudents) {
    filteredExtents.push(7, 34)
  }
  if (!nondegreeStudents) {
    filteredExtents.push(33, 99, 14, 13)
  }
  if (!cancelledStudents) {
    studyrightWhere.canceldate = null
  }

  let studentWhere = {}
  if (tag) {
    const taggedStudentnumbers = await TagStudent.findAll({
      attributes: ['studentnumber'],
      where: {
        tag_id: tag
      }
    })
    studentWhere.where = {
      student_studentnumber: {
        [Op.in]: taggedStudentnumbers.map(sn => sn.studentnumber)
      }
    }
  }

  const students = await Studyright.findAll({
    attributes: ['student_studentnumber'],
    include: {
      model: StudyrightElement,
      attributes: [],
      required: true,
      where: {
        code: {
          [Op.in]: studyRights
        }
      },
      include: {
        model: ElementDetails,
        attributes: []
      }
    },
    group: [sequelize.col('studyright.studyrightid')],
    where: {
      [Op.or]: [
        {
          ['$studyright_elements->element_detail.type$']: {
            [Op.ne]: 20
          }
        },
        {
          ['$studyright_elements.startdate$']: {
            [Op.between]: [startDate, endDate]
          }
        }
      ],
      ...studyrightWhere
    },
    ...studentWhere,
    having: count('studyright_elements.code', studyRights.length, true),
    raw: true
  })
  return [...new Set(students.map(s => s.student_studentnumber))]
}

const parseQueryParams = query => {
  const { semesters, studentStatuses, studyRights, months, endYear, startYear, tag } = query
  const startDate = semesters.includes('FALL')
    ? `${startYear}-${semesterStart[semesters.find(s => s === 'FALL')]}`
    : `${moment(startYear, 'YYYY')
        .add(1, 'years')
        .format('YYYY')}-${semesterStart[semesters.find(s => s === 'SPRING')]}`
  const endDate = semesters.includes('SPRING')
    ? `${moment(endYear, 'YYYY')
        .add(1, 'years')
        .format('YYYY')}-${semesterEnd[semesters.find(s => s === 'SPRING')]}`
    : `${endYear}-${semesterEnd[semesters.find(s => s === 'FALL')]}`
  const exchangeStudents = studentStatuses && studentStatuses.includes('EXCHANGE')
  const cancelledStudents = studentStatuses && studentStatuses.includes('CANCELLED')
  const nondegreeStudents = studentStatuses && studentStatuses.includes('NONDEGREE')
  return {
    exchangeStudents,
    cancelledStudents,
    nondegreeStudents,
    studyRights: Array.isArray(studyRights) ? studyRights : Object.values(studyRights),
    months,
    startDate,
    endDate,
    tag
  }
}

const formatStudentsForApi = async (students, startDate, endDate, { studyRights }) => {
  const startDateMoment = moment(startDate)
  const endDateMoment = moment(endDate)
  const result = students.reduce(
    (stats, student) => {
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
                stats.studyrights.degrees = [
                  ...stats.studyrights.degrees,
                  { code: element.code, name: element.element_detail.name }
                ]
              }
            }
            if (element.element_detail && element.element_detail.type === 20) {
              if (!stats.studyrights.programmes.map(d => d.code).includes(element.code)) {
                stats.studyrights.programmes = [
                  ...stats.studyrights.programmes,
                  { code: element.code, name: element.element_detail.name }
                ]
              }
            }
          })
        }
      })

      student.semester_enrollments.forEach(({ semestercode, semester }) => {
        stats.semesters[semestercode] = semester
      })

      stats.students.push(
        formatStudentForPopulationStatistics(student, startDate, endDate, startDateMoment, endDateMoment)
      )
      return stats
    },
    {
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
    }
  )

  const transferredStudyright = s => {
    const transferred_from = s.transfers.find(
      t => t.target.code === studyRights.programme && moment(t.transferdate).isBetween(startDateMoment, endDateMoment)
    )
    if (transferred_from) {
      s.transferredStudyright = true
      s.transferSource = transferred_from.source
    }
    return s
  }

  return {
    students: result.students.map(transferredStudyright),
    transfers: result.transfers,
    extents: Object.values(result.extents),
    semesters: Object.values(result.semesters),
    studyrights: result.studyrights
  }
}

const formatQueryParamArrays = (query, params) => {
  let res = { ...query }
  params.forEach(p => {
    if (!res[p]) return
    res[p] = Array.isArray(res[p]) ? res[p] : [res[p]]
  })
  return res
}

const optimizedStatisticsOf = async (query, studentnumberlist) => {
  const formattedQueryParams = formatQueryParamArrays(query, ['semesters', 'studentStatuses'])

  if (
    !formattedQueryParams.semesters.map(semester => semester === 'FALL' || semester === 'SPRING').every(e => e === true)
  ) {
    return { error: 'Semester should be either SPRING OR FALL' }
  }

  if (
    formattedQueryParams.studentStatuses &&
    !formattedQueryParams.studentStatuses
      .map(status => status === 'CANCELLED' || status === 'EXCHANGE' || status === 'NONDEGREE')
      .every(e => e === true)
  ) {
    return { error: 'Student status should be either CANCELLED or EXCHANGE or NONDEGREE' }
  }
  const {
    studyRights,
    startDate,
    months,
    endDate,
    exchangeStudents,
    cancelledStudents,
    nondegreeStudents
  } = parseQueryParams(formattedQueryParams)

  const studentnumbers = studentnumberlist
    ? studentnumberlist
    : await studentnumbersWithAllStudyrightElements(
        studyRights,
        startDate,
        endDate,
        exchangeStudents,
        cancelledStudents,
        nondegreeStudents
      )
  const students = await getStudentsIncludeCoursesBetween(
    studentnumbers,
    startDate,
    dateMonthsFromNow(startDate, months),
    studyRights,
    formattedQueryParams.tag
  )

  const formattedStudents = await formatStudentsForApi(students, startDate, endDate, formattedQueryParams)
  return formattedStudents
}

const getMainCourse = (course, codeduplicates) => {
  const formattedcode = unifyOpenUniversity(course.code)
  const maincourse = codeduplicates[formattedcode]
  return maincourse || course
}

const findCourses = async (studentnumbers, beforeDate) => {
  const res = await Course.findAll({
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
        }
      },
      {
        attributes: ['discipline_id', 'name'],
        model: Discipline
      },
      {
        attributes: ['coursetypecode', 'name'],
        model: CourseType,
        required: true
      }
    ]
  })
  return res
}

const checkThatSelectedStudentsAreUnderRequestedStudyright = (selectedStudents, allStudents) =>
  !selectedStudents.every(s => allStudents.includes(s))

const parseCreditInfo = credit => ({
  studentnumber: credit.student_studentnumber,
  grade: credit.grade,
  passingGrade: Credit.passed(credit),
  failingGrade: Credit.failed(credit),
  improvedGrade: Credit.improved(credit),
  date: credit.attainment_date
})

const bottlenecksOf = async (query, studentnumberlist) => {
  const isValidRequest = async (query, params) => {
    const { studyRights, startDate, endDate, exchangeStudents, cancelledStudents, nondegreeStudents } = params
    if (!query.semesters.every(semester => semester === 'FALL' || semester === 'SPRING')) {
      return { error: 'Semester should be either SPRING OR FALL' }
    }
    if (
      query.studentStatuses &&
      !query.studentStatuses.every(status => status === 'CANCELLED' || status === 'EXCHANGE' || status === 'NONDEGREE')
    ) {
      return { error: 'Student status should be either CANCELLED or EXCHANGE or NONDEGREE' }
    }
    if (query.selectedStudents) {
      const allStudents = await studentnumbersWithAllStudyrightElements(
        studyRights,
        startDate,
        endDate,
        exchangeStudents,
        cancelledStudents,
        nondegreeStudents,
        query.tag
      )
      const disallowedRequest = checkThatSelectedStudentsAreUnderRequestedStudyright(
        query.selectedStudents,
        allStudents
      )
      if (disallowedRequest) return { error: 'Trying to request unauthorized students data' }
    }
    return null
  }
  const getStudentsAndCourses = async (selectedStudents, studentnumberlist) => {
    if (!studentnumberlist) {
      const {
        months,
        studyRights,
        startDate,
        endDate,
        exchangeStudents,
        cancelledStudents,
        nondegreeStudents,
        tag
      } = params
      const studentnumbers =
        selectedStudents ||
        (await studentnumbersWithAllStudyrightElements(
          studyRights,
          startDate,
          endDate,
          exchangeStudents,
          cancelledStudents,
          nondegreeStudents,
          tag
        ))
      const allstudents = studentnumbers.reduce((numbers, num) => ({ ...numbers, [num]: true }), {})
      const courses = await findCourses(studentnumbers, dateMonthsFromNow(startDate, months))
      return [allstudents, courses]
    } else {
      const allstudents = studentnumberlist.reduce((numbers, num) => {
        numbers[num] = true
        return numbers
      }, {})
      const courses = await findCourses(studentnumberlist, new Date())
      return [allstudents, courses]
    }
  }
  const params = parseQueryParams(query)
  const [[allstudents, courses], codeToMainCourse, error] = await Promise.all([
    getStudentsAndCourses(query.selectedStudents, studentnumberlist),
    getCodeToMainCourseMap(),
    isValidRequest(query, params)
  ])
  if (error) return error

  const bottlenecks = {
    disciplines: {},
    coursetypes: {}
  }

  const stats = {}

  const startYear = parseInt(query.startYear, 10)
  const allstudentslength = Object.keys(allstudents).length
  courses.forEach(course => {
    let { disciplines, course_type } = course
    const maincourse = getMainCourse(course, codeToMainCourse)
    if (!stats[maincourse.code]) {
      stats[maincourse.code] = new CourseStatsCounter(maincourse.code, maincourse.name, allstudentslength)
    }
    const coursestats = stats[maincourse.code]

    coursestats.addCourseType(course_type.coursetypecode, course_type.name)
    bottlenecks.coursetypes[course_type.coursetypecode] = course_type.name
    disciplines.forEach(({ discipline_id, name }) => {
      coursestats.addCourseDiscipline(discipline_id, name)
      bottlenecks.disciplines[discipline_id] = name
    })

    course.credits.forEach(credit => {
      const { studentnumber, passingGrade, improvedGrade, failingGrade, grade, date } = parseCreditInfo(credit)
      const semester = getPassingSemester(startYear, date)
      coursestats.markCredit(studentnumber, grade, passingGrade, failingGrade, improvedGrade, semester)
    })
    stats[maincourse.code] = coursestats
  })
  bottlenecks.coursestatistics = Object.values(stats).map(coursestatistics => coursestatistics.getFinalStats())
  return bottlenecks
}

module.exports = {
  studentnumbersWithAllStudyrightElements,
  universityEnrolmentDates,
  optimizedStatisticsOf,
  bottlenecksOf,
  getEarliestYear
}
