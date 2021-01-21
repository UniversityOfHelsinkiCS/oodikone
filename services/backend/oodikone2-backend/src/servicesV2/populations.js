const { Op } = require('sequelize')
const moment = require('moment')
const { sortBy } = require('lodash')
const { getCurrentSemester } = require('./semesters')

const {
  Student,
  Credit,
  Course,
  Studyright,
  StudyrightExtent,
  ElementDetail,
  //Discipline,
  CourseType,
  SemesterEnrollment,
  Semester,
  Transfer,
  StudyrightElement
} = require('../modelsV2')
const {
  dbConnections: { sequelize }
} = require('../databaseV2/connection')
const { Tag, TagStudent } = require('../models/models_kone')
const { getCodeToMainCourseMap, unifyOpenUniversity } = require('./courses')
const { CourseStatsCounter } = require('./course_stats_counter')
const { getPassingSemester, semesterEnd, semesterStart } = require('../util/semester')
const { getAllProgrammes } = require('./studyrights')

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
    tags,
    option
  },
  credits,
  startDate,
  endDate,
  startDateMoment,
  endDateMoment
) => {
  const toCourse = ({ grade, attainment_date, credits, course_code, credittypecode, isStudyModule }) => {
    const attainment_date_normailized =
      attainment_date < startDate
        ? startDateMoment
            .clone()
            .add(1, 'day')
            .toISOString()
        : attainment_date
    const passed = Credit.passed({ credittypecode })

    return {
      course_code,
      date: attainment_date_normailized,
      passed,
      grade: passed ? grade : 'Hyl.',
      credits,
      isStudyModuleCredit: isStudyModule,
      credittypecode
    }
  }

  studyrights = studyrights || []

  const started = dateofuniversityenrollment
  return {
    firstnames,
    lastname,
    studyrights,
    started,
    studentNumber: studentnumber,
    credits: creditcount || 0,
    courses: credits[studentnumber] ? credits[studentnumber].map(toCourse) : [],
    name: abbreviatedname,
    transfers: transfers || [],
    gender_code,
    gender: { gender_en, gender_fi, gender_sv },
    email,
    semesterenrollments: semester_enrollments || [],
    updatedAt: updatedAt || createdAt,
    tags: tags || [],
    studyrightStart: startDate,
    starting: moment(started).isBetween(startDateMoment, endDateMoment, null, '[]'),
    option
  }
}

const dateMonthsFromNow = (date, months) =>
  moment(date)
    .add(months, 'months')
    .format('YYYY-MM-DD')

const getStudentsIncludeCoursesBetween = async (studentnumbers, startDate, endDate, studyright, tag) => {
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

  const { studentnumbersWithTag, studentNumberToTags } = studentTags.reduce(
    (acc, t) => {
      acc.studentNumberToTags[t.studentnumber] = acc.studentNumberToTags[t.studentnumber] || []
      acc.studentNumberToTags[t.studentnumber].push(t)
      if (tag && t.tag_id === tag.tag_id) {
        acc.studentnumbersWithTag.push(t.studentnumber)
      }
      return acc
    },
    { studentnumbersWithTag: [], studentNumberToTags: {} }
  )
  if (tag) studentnumbers = studentnumbersWithTag

  const attainmentDateFrom = tag ? moment(startDate).year(tag.year) : startDate
  const creditsOfStudentOther = {
    attainment_date: {
      [Op.between]: [attainmentDateFrom, endDate]
    },
    student_studentnumber: {
      [Op.in]: studentnumbers
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

  if (studentnumbers.length === 0)
    return { students: [], credits: [], extents: [], semesters: [], elementdetails: [], courses: [] }
  const [courses, students, credits, extents, semesters, elementdetails] = await Promise.all([
    Course.findAll({
      attributes: [sequelize.literal('DISTINCT ON("code") code'), 'name', 'coursetypecode'],
      include: [
        {
          model: Credit,
          attributes: [],
          where: creditsOfStudent
        }
      ],
      raw: true
    }),
    Student.findAll({
      attributes: [
        'firstnames',
        'lastname',
        'studentnumber',
        'home_country_en',
        'dateofuniversityenrollment',
        'creditcount',
        'abbreviatedname',
        'email',
        'updatedAt',
        'gender_code'
        /* 'gender_fi',
        'gender_sv',
        'gender_en' */
      ],
      include: [
        {
          model: Transfer,
          attributes: ['transferdate', 'sourcecode', 'targetcode'],
          separate: true
        },
        {
          model: Studyright,
          attributes: [
            'studyrightid',
            'startdate',
            'enddate',
            'extentcode',
            'graduated',
            'canceldate',
            'prioritycode',
            'faculty_code',
            'studystartdate'
          ],
          separate: true,
          include: [
            {
              model: StudyrightElement,
              required: true,
              attributes: ['id', 'startdate', 'enddate', 'studyrightid', 'code'],
              include: {
                model: ElementDetail
              }
            }
          ]
        },
        {
          model: SemesterEnrollment,
          attributes: ['enrollmenttype', 'semestercode', 'enrollment_date'],
          separate: true,
          include: {
            model: Semester,
            attributes: [],
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
    }),
    Credit.findAll({
      attributes: [
        'grade',
        'credits',
        'credittypecode',
        'attainment_date',
        'isStudyModule',
        'student_studentnumber',
        'course_code'
      ],
      where: creditsOfStudent,
      raw: true
    }),
    StudyrightExtent.findAll({
      attributes: [
        sequelize.literal('DISTINCT ON("studyright_extent"."extentcode") "studyright_extent"."extentcode"'),
        'name'
      ],
      include: [
        {
          model: Studyright,
          attributes: [],
          required: true,
          where: {
            student_studentnumber: {
              [Op.in]: studentnumbers
            }
          }
        }
      ],
      raw: true
    }),
    Semester.findAll({
      attributes: [
        sequelize.literal('DISTINCT ON("semester"."semestercode") "semester"."semestercode"'),
        'name',
        'startdate',
        'enddate'
      ],
      include: {
        model: SemesterEnrollment,
        attributes: [],
        required: true,
        where: {
          studentnumber: {
            [Op.in]: studentnumbers
          }
        }
      },
      where: {
        startdate: {
          [Op.between]: [startDate, endDate]
        }
      },
      raw: true
    }),
    sequelize.query(
      `
SELECT DISTINCT ON (code) code, name, type FROM element_details WHERE
EXISTS (SELECT 1 FROM transfers WHERE studentnumber IN (:studentnumbers) AND (code = sourcecode OR code = targetcode)) OR
EXISTS (SELECT 1 FROM studyright_elements WHERE studentnumber IN (:studentnumbers))`,
      {
        replacements: { studentnumbers },
        type: sequelize.QueryTypes.SELECT
      }
    )
  ])

  students.forEach(student => {
    student.tags = studentNumberToTags[student.studentnumber] || []
  })

  return { students, credits, extents, semesters, elementdetails, courses }
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
  transferredStudents,
  tag
) => {
  // eslint-disable-line

  // db startdate is formatted to utc so need to change it when querying
  const formattedStartDate = new Date(moment.tz(startDate, 'Europe/Helsinki').format()).toUTCString()

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
  // this does not work in SIS, that is why we have a kludge below
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
        model: ElementDetail,
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
        sequelize.where(
          sequelize.fn(
            'GREATEST',
            sequelize.col('studyright_elements.startdate'),
            sequelize.col('studyright.studystartdate')
          ),
          {
            [Op.between]: [formattedStartDate, endDate]
          }
        )
      ],
      ...studyrightWhere
    },
    ...studentWhere,
    having: count('studyright_elements.code', studyRights.length, true),
    raw: true
  })

  let studentnumbers = [...new Set(students.map(s => s.student_studentnumber))]

  // study right cancel does not work in SIS, but the below kludge should do the trick
  // since canceldate != null   === student does not have any enrolment
  if (!cancelledStudents) {
    const { semestercode } = await getCurrentSemester()

    const enrolments = await SemesterEnrollment.findAll({
      where: {
        studentnumber: {
          [Op.in]: studentnumbers
        },
        semestercode
      }
    })

    const enrolledStudentnumbers = enrolments.map(e => e.studentnumber)
    studentnumbers = enrolledStudentnumbers
  }

  // bit hacky solution, but this is used to filter out studentnumbers who have since changed studytracks
  const rights = await Studyright.findAll({
    attributes: ['studyrightid'],
    where: {
      student_studentnumber: {
        [Op.in]: studentnumbers
      }
    },
    include: {
      attributes: [],
      model: StudyrightElement,
      where: {
        code: {
          [Op.in]: studyRights
        }
      }
    },
    group: ['studyright.studyrightid'],
    having: count('studyright_elements.id', studyRights.length, true),
    raw: true
  })

  // bit hacky solution, but this is used to filter out studentnumbers who have since changed studytracks
  const allStudytracksForStudents = await StudyrightElement.findAll({
    where: {
      studyrightid: {
        [Op.in]: rights.map(r => r.studyrightid)
      }
    },
    include: {
      model: ElementDetail,
      where: {
        type: {
          [Op.eq]: 30
        }
      }
    },
    raw: true
  })

  const formattedStudytracks = studentnumbers.reduce((acc, curr) => {
    acc[curr] = allStudytracksForStudents.filter(srE => srE.studentnumber === curr)
    return acc
  }, {})

  const filteredStudentnumbers = studentnumbers.filter(studentnumber => {
    const newestStudytrack = sortBy(formattedStudytracks[studentnumber], ['enddate', 'startdate']).reverse()[0]
    if (!newestStudytrack) return false
    return studyRights.includes(newestStudytrack.code)
  })
  const studentnumberlist = filteredStudentnumbers.length > 0 ? filteredStudentnumbers : studentnumbers

  // fetch students that have transferred out of the programme and filter out these studentnumbers
  if (!transferredStudents) {
    const transferredOutStudents = await Transfer.findAll({
      attributes: ['studentnumber'],
      where: {
        sourcecode: {
          [Op.in]: studyRights
        },
        transferdate: {
          [Op.gt]: startDate
        },
        studentnumber: {
          [Op.in]: studentnumberlist
        }
      },
      raw: true
    }).map(s => s.studentnumber)

    const notTransferredStudents = studentnumberlist.filter(sn => !transferredOutStudents.includes(sn))
    return notTransferredStudents
  }

  return studentnumberlist
}

const parseQueryParams = query => {
  const { semesters, studentStatuses, studyRights, months, year, tag } = query
  const startDate = semesters.includes('FALL')
    ? `${year}-${semesterStart[semesters.find(s => s === 'FALL')]}`
    : `${moment(year, 'YYYY')
        .add(1, 'years')
        .format('YYYY')}-${semesterStart[semesters.find(s => s === 'SPRING')]}`
  const endDate = semesters.includes('SPRING')
    ? `${moment(year, 'YYYY')
        .add(1, 'years')
        .format('YYYY')}-${semesterEnd[semesters.find(s => s === 'SPRING')]}`
    : `${year}-${semesterEnd[semesters.find(s => s === 'FALL')]}`
  const exchangeStudents = studentStatuses && studentStatuses.includes('EXCHANGE')
  const cancelledStudents = studentStatuses && studentStatuses.includes('CANCELLED')
  const nondegreeStudents = studentStatuses && studentStatuses.includes('NONDEGREE')
  const transferredStudents = studentStatuses && studentStatuses.includes('TRANSFERRED')

  return {
    exchangeStudents,
    cancelledStudents,
    nondegreeStudents,
    transferredStudents,
    // if someone passes something falsy like null as the studyright, remove it so it doesn't break
    // the sequelize query
    studyRights: (Array.isArray(studyRights) ? studyRights : Object.values(studyRights)).filter(Boolean),
    months,
    startDate,
    endDate,
    tag
  }
}

const getOptionsForStudents = async (students, code, level) => {
  if (!code || !students.length) return {}

  let graduated
  let currentExtent
  let optionExtent

  if (level === 'BSC') {
    graduated = { graduated: 1 }
    currentExtent = 1
    optionExtent = 2
  } else if (level === 'MSC') {
    graduated = {}
    currentExtent = 2
    optionExtent = 1
  } else {
    throw new Error('Invalid study level ' + level)
  }

  const programmes = await getAllProgrammes()

  const currentStudyrights = await Studyright.findAll({
    include: [
      {
        model: StudyrightElement,
        where: {
          studentnumber: {
            [Op.in]: students
          },
          code: code
        }
      }
    ],
    where: {
      ...graduated,
      extentcode: currentExtent,
      student_studentnumber: {
        [Op.in]: students
      }
    },
    attributes: ['studentStudentnumber', 'givendate']
  })

  const currentStudyrightsMap = currentStudyrights.reduce((obj, studyright) => {
    obj[studyright.studentStudentnumber] = studyright.givendate
    return obj
  }, {})

  const options = await Studyright.findAll({
    include: [
      {
        model: StudyrightElement,
        where: {
          studentnumber: {
            [Op.in]: students
          },
          code: {
            [Op.in]: programmes.map(p => p.code)
          }
        },
        include: [
          {
            model: ElementDetail,
            attributes: ['name']
          }
        ],
        attributes: ['code', 'startdate']
      }
    ],
    where: {
      extentcode: optionExtent,
      student_studentnumber: {
        [Op.in]: students
      }
    },
    order: [[StudyrightElement, 'startdate', 'DESC']],
    attributes: ['studentStudentnumber', 'givendate']
  })

  return options
    .filter(m => m.studentStudentnumber in currentStudyrightsMap)
    .filter(m => m.givendate.getTime() === currentStudyrightsMap[m.studentStudentnumber].getTime())
    .reduce((obj, element) => {
      obj[element.studentStudentnumber] = {
        code: element.studyright_elements[0].code,
        name: element.studyright_elements[0].element_detail.name
      }
      return obj
    }, {})
}

const formatStudentsForApi = async (
  { students, credits, extents, semesters, elementdetails, courses },
  startDate,
  endDate,
  { studyRights },
  optionData
) => {
  const startDateMoment = moment(startDate)
  const endDateMoment = moment(endDate)
  elementdetails = elementdetails.reduce(
    (acc, e) => {
      acc.data[e.code] = e
      if (e.type === 10) acc.degrees.push(e.code)
      if (e.type === 20) acc.programmes.push(e.code)
      return acc
    },
    { programmes: [], degrees: [], data: {} }
  )
  credits = credits.reduce((acc, e) => {
    acc[e.student_studentnumber] = acc[e.student_studentnumber] || []
    acc[e.student_studentnumber].push(e)
    return acc
  }, {})
  const result = students.reduce(
    (stats, student) => {
      student.transfers.forEach(transfer => {
        const target = stats.transfers.targets[transfer.targetcode] || { sources: {} }
        const source = stats.transfers.sources[transfer.sourcecode] || { targets: {} }
        target.sources[transfer.sourcecode] = true
        source.targets[transfer.targetcode] = true
        stats.transfers.targets[transfer.targetcode] = target
        stats.transfers.sources[transfer.sourcecode] = source
      })
      if (student.studentnumber in optionData) student.option = optionData[student.studentnumber]
      else student.option = null
      stats.students.push(
        formatStudentForPopulationStatistics(student, credits, startDate, endDate, startDateMoment, endDateMoment)
      )
      return stats
    },
    {
      students: [],
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
      t =>
        t.targetcode === studyRights.programme &&
        // add bit of flex for students that transferred just before the startdate
        moment(t.transferdate).isBetween(startDateMoment.subtract(1, 'd'), endDateMoment.add(1, 'd'))
    )
    if (transferred_from) {
      s.transferredStudyright = true
      s.transferSource = transferred_from.sourcecode
    } else {
      s.transferredStudyright = false
      s.transferSource = null
    }
    return s
  }

  const returnvalue = {
    students: result.students.map(transferredStudyright),
    transfers: result.transfers,
    extents,
    semesters,
    courses,
    elementdetails
  }
  return returnvalue
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

  if (!formattedQueryParams.semesters.every(semester => semester === 'FALL' || semester === 'SPRING')) {
    return { error: 'Semester should be either SPRING OR FALL' }
  }

  if (
    formattedQueryParams.studentStatuses &&
    !formattedQueryParams.studentStatuses.every(
      status => status === 'CANCELLED' || status === 'EXCHANGE' || status === 'NONDEGREE' || status === 'TRANSFERRED'
    )
  ) {
    return { error: 'Student status should be either CANCELLED or EXCHANGE or NONDEGREE or TRANSFERRED' }
  }
  const {
    studyRights,
    startDate,
    months,
    endDate,
    exchangeStudents,
    cancelledStudents,
    nondegreeStudents,
    transferredStudents,
    tag
  } = parseQueryParams(formattedQueryParams)

  // db startdate is formatted to utc so need to change it when querying
  const formattedStartDate = new Date(moment.tz(startDate, 'Europe/Helsinki').format()).toUTCString()

  const studentnumbers = studentnumberlist
    ? studentnumberlist
    : await studentnumbersWithAllStudyrightElements(
        studyRights,
        formattedStartDate,
        endDate,
        exchangeStudents,
        cancelledStudents,
        nondegreeStudents,
        transferredStudents
      )
  // wtf
  // plz
  const code = studyRights[0] || ''
  let optionData = {}
  if (code.includes('MH')) {
    optionData = await getOptionsForStudents(studentnumbers, code, 'MSC')
  } else if (code.includes('KH')) {
    optionData = await getOptionsForStudents(studentnumbers, code, 'BSC')
  }

  const { students, credits, extents, semesters, elementdetails, courses } = await getStudentsIncludeCoursesBetween(
    studentnumbers,
    startDate,
    dateMonthsFromNow(startDate, months),
    studyRights,
    tag
  )

  const formattedStudents = await formatStudentsForApi(
    { students, credits, extents, semesters, elementdetails, courses },
    startDate,
    endDate,
    formattedQueryParams,
    optionData
  )

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
      /* {
        attributes: ['discipline_id', 'name'],
        model: Discipline
      }, */
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
    const {
      studyRights,
      startDate,
      endDate,
      exchangeStudents,
      cancelledStudents,
      nondegreeStudents,
      transferredStudents
    } = params
    if (!query.semesters.every(semester => semester === 'FALL' || semester === 'SPRING')) {
      return { error: 'Semester should be either SPRING OR FALL' }
    }
    if (
      query.studentStatuses &&
      !query.studentStatuses.every(
        status => status === 'CANCELLED' || status === 'EXCHANGE' || status === 'NONDEGREE' || status === 'TRANSFERRED'
      )
    ) {
      return { error: 'Student status should be either CANCELLED or EXCHANGE or NONDEGREE or TRANSFERRED' }
    }
    if (query.selectedStudents) {
      const allStudents = await studentnumbersWithAllStudyrightElements(
        studyRights,
        startDate,
        endDate,
        exchangeStudents,
        cancelledStudents,
        nondegreeStudents,
        transferredStudents,
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
        transferredStudents,
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
          transferredStudents,
          tag
        ))
      const allstudents = studentnumbers.reduce((numbers, num) => {
        numbers[num] = true
        return numbers
      }, {})
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

  const startYear = parseInt(query.year, 10)
  const allstudentslength = Object.keys(allstudents).length
  courses.forEach(course => {
    let { /* disciplines,  */ course_type } = course
    const maincourse = getMainCourse(course, codeToMainCourse)
    if (!stats[maincourse.code]) {
      stats[maincourse.code] = new CourseStatsCounter(maincourse.code, maincourse.name, allstudentslength)
    }
    const coursestats = stats[maincourse.code]

    coursestats.addCourseType(course_type.coursetypecode, course_type.name)
    bottlenecks.coursetypes[course_type.coursetypecode] = course_type.name
    /* disciplines.forEach(({ discipline_id, name }) => {
      coursestats.addCourseDiscipline(discipline_id, name)
      bottlenecks.disciplines[discipline_id] = name
    }) */

    course.credits.forEach(credit => {
      const { studentnumber, passingGrade, improvedGrade, failingGrade, grade, date } = parseCreditInfo(credit)
      const semester = getPassingSemester(startYear, date)
      coursestats.markCredit(studentnumber, grade, passingGrade, failingGrade, improvedGrade, semester)
    })
    stats[maincourse.code] = coursestats
  })
  bottlenecks.coursestatistics = Object.values(stats).map(coursestatistics => coursestatistics.getFinalStats())
  bottlenecks.allStudents = allstudentslength
  return bottlenecks
}

module.exports = {
  studentnumbersWithAllStudyrightElements,
  universityEnrolmentDates,
  optimizedStatisticsOf,
  bottlenecksOf,
  getEarliestYear
}
