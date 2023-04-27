const Sequelize = require('sequelize')
const { Op } = Sequelize
const moment = require('moment')
const { sortBy, keyBy } = require('lodash')

const {
  Student,
  Credit,
  Course,
  Studyright,
  StudyrightExtent,
  ElementDetail,
  Studyplan,
  SemesterEnrollment,
  Semester,
  Transfer,
  StudyrightElement,
  Enrollment,
} = require('../models')
const {
  dbConnections: { sequelize },
} = require('../database/connection')
const { Tag, TagStudent } = require('../models/models_kone')
const { CourseStatsCounter } = require('./course_stats_counter')
const { getPassingSemester, semesterEnd, semesterStart } = require('../util/semester')
const { getAllProgrammes } = require('./studyrights')
const { encrypt } = require('../services/encrypt')
const { getCriteria } = require('./studyProgrammeCriteria')

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
// Progress tab related helper functions.
const createEmptyCriteriaYear = (criteria, year) => {
  return {
    credits: false,
    totalSatisfied: 0,
    coursesSatisfied:
      criteria?.courses && criteria?.courses[year]
        ? criteria.courses[year].reduce((acc, course) => {
            acc[course] = null
            return acc
          }, {})
        : {},
  }
}

const getCreditAmount = (course, hops, courseCode, startDate, addition) => {
  return moment(course.date).isBetween(moment(startDate), moment(startDate).add(addition, 'year')) &&
    hops.length > 0 &&
    (hops[0].included_courses.includes(courseCode) || hops[0].included_courses.includes(course.course_code))
    ? course.credits
    : 0
}

const updateCourseByYear = (criteria, criteriaYear, course, criteriaChecked, yearToAdd, correctCode) => {
  if (
    criteria?.courses &&
    criteria?.courses[criteriaYear] &&
    (criteria.courses[criteriaYear].includes(course.course_code) ||
      criteria.courses[criteriaYear].some(
        c => criteria.allCourses[c] && criteria.allCourses[c].includes(course.course_code)
      ))
  ) {
    if (
      !criteriaChecked[yearToAdd].coursesSatisfied[correctCode] ||
      new Date(criteriaChecked[yearToAdd].coursesSatisfied[correctCode]) > new Date(course.date)
    ) {
      criteriaChecked[yearToAdd].coursesSatisfied[correctCode] = course.date
    }
  }
}

const updateCreditcriteriaInfo = (criteria, criteriaYear, criteriaChecked, yearToAdd, academicYears, academicYear) => {
  if (criteria.courses) {
    if (criteriaChecked?.[yearToAdd]) {
      criteriaChecked[yearToAdd].totalSatisfied +=
        Object.keys(criteriaChecked?.[yearToAdd].coursesSatisfied).filter(
          course => criteriaChecked?.[yearToAdd].coursesSatisfied[course] !== null
        ).length || 0
    }
    if (academicYears[academicYear] >= criteria?.credits[criteriaYear] && criteria?.credits[criteriaYear] > 0) {
      criteriaChecked[yearToAdd].credits = true
      criteriaChecked[yearToAdd].totalSatisfied += 1
    }
  }
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
    secondary_email,
    phone_number,
    studyrights,
    studyplans,
    semester_enrollments,
    transfers,
    updatedAt,
    createdAt,
    gender_code,
    gender_fi,
    gender_sv,
    gender_en,
    tags,
    option,
    birthdate,
    sis_person_id,
  },
  enrollments,
  credits,
  startDate,
  startDateMoment,
  endDateMoment,
  criteria,
  code
) => {
  const toCourse = ({ grade, attainment_date, credits, course_code, credittypecode, isStudyModule, language }) => {
    const attainment_date_normailized =
      attainment_date < startDate ? startDateMoment.clone().add(1, 'day').toISOString() : attainment_date
    const passed = Credit.passed({ credittypecode })

    return {
      course_code,
      date: attainment_date_normailized,
      passed,
      grade: passed ? grade : 'Hyl.',
      credits,
      isStudyModuleCredit: isStudyModule,
      credittypecode,
      language,
    }
  }
  const criteriaCoursesBySubstitutions = criteria?.allCourses
    ? Object.keys(criteria.allCourses).reduce((acc, code) => {
        acc[code] = code
        criteria.allCourses[code].map(subst => (acc[subst] = code))
        return acc
      }, {})
    : {}

  const toProgressCriteria = () => {
    const criteriaChecked = {
      year1: createEmptyCriteriaYear(criteria, 'yearOne'),
      year2: createEmptyCriteriaYear(criteria, 'yearTwo'),
      year3: createEmptyCriteriaYear(criteria, 'yearThree'),
      year4: createEmptyCriteriaYear(criteria, 'yearFour'),
      year5: createEmptyCriteriaYear(criteria, 'yearFive'),
      year6: createEmptyCriteriaYear(criteria, 'yearSix'),
    }
    const correctStudyplan = studyplans ? studyplans.filter(plan => plan.programme_code === code) : []
    const academicYears = { first: 0, second: 0, third: 0, fourth: 0, fifth: 0, sixth: 0 }
    if (criteria.courses || criteria.credits) {
      const courses = credits[studentnumber] ? credits[studentnumber].map(toCourse) : []
      courses.forEach(course => {
        if (course.passed) {
          const correctCode = criteriaCoursesBySubstitutions[course.course_code]
          updateCourseByYear(criteria, 'yearOne', course, criteriaChecked, 'year1', correctCode)
          updateCourseByYear(criteria, 'yearTwo', course, criteriaChecked, 'year2', correctCode)
          updateCourseByYear(criteria, 'yearThree', course, criteriaChecked, 'year3', correctCode)
          updateCourseByYear(criteria, 'yearFour', course, criteriaChecked, 'year4', correctCode)
          updateCourseByYear(criteria, 'yearFive', course, criteriaChecked, 'year5', correctCode)
          updateCourseByYear(criteria, 'yearSix', course, criteriaChecked, 'year6', correctCode)
          academicYears.first += getCreditAmount(course, correctStudyplan, correctCode, startDate, 1)
          academicYears.second += getCreditAmount(course, correctStudyplan, correctCode, startDate, 2)
          academicYears.third += getCreditAmount(course, correctStudyplan, correctCode, startDate, 3)
          academicYears.fourth += getCreditAmount(course, correctStudyplan, correctCode, startDate, 4)
          academicYears.fifth += getCreditAmount(course, correctStudyplan, correctCode, startDate, 5)
          academicYears.sixth += getCreditAmount(course, correctStudyplan, correctCode, startDate, 6)
        }
      })
    }

    updateCreditcriteriaInfo(criteria, 'yearOne', criteriaChecked, 'year1', academicYears, 'first')
    updateCreditcriteriaInfo(criteria, 'yearTwo', criteriaChecked, 'year2', academicYears, 'second')
    updateCreditcriteriaInfo(criteria, 'yearThree', criteriaChecked, 'year3', academicYears, 'third')
    updateCreditcriteriaInfo(criteria, 'yearFour', criteriaChecked, 'year4', academicYears, 'fourth')
    updateCreditcriteriaInfo(criteria, 'yearFive', criteriaChecked, 'year5', academicYears, 'fifth')
    updateCreditcriteriaInfo(criteria, 'yearSix', criteriaChecked, 'year6', academicYears, 'sixth')
    return criteriaChecked
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
    enrollments: enrollments[studentnumber],
    name: abbreviatedname,
    transfers: transfers || [],
    gender_code,
    gender: { gender_en, gender_fi, gender_sv },
    email,
    secondaryEmail: secondary_email,
    phoneNumber: phone_number,
    semesterenrollments: semester_enrollments
      ? semester_enrollments.sort((a, b) => a.semestercode - b.semestercode)
      : [],
    updatedAt: updatedAt || createdAt,
    tags: tags || [],
    studyrightStart: startDate,
    starting: moment(started).isBetween(startDateMoment, endDateMoment, null, '[]'),
    option,
    birthdate,
    studyplans,
    sis_person_id,
    criteriaProgress: toProgressCriteria(),
  }
}

const dateMonthsFromNow = (date, months) => moment(date).add(months, 'months').format('YYYY-MM-DD')

const getStudentsIncludeCoursesBetween = async (studentnumbers, startDate, endDate, studyright, tag) => {
  const studentTags = await TagStudent.findAll({
    attributes: ['tag_id', 'studentnumber'],
    include: [
      {
        model: Tag,
        attributes: ['tag_id', 'tagname', 'personal_user_id'],
      },
    ],
    where: {
      studentnumber: {
        [Op.in]: studentnumbers,
      },
    },
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
  const studyPlans = await Studyplan.findAll({
    where: { studentnumber: studentnumbers },
    attributes: ['included_courses'],
    raw: true,
  })
  const studyPlanCourses = Array.from(new Set([...studyPlans.map(plan => plan.included_courses)].flat()))

  const creditsOfStudentOther = {
    [Op.or]: [
      {
        attainment_date: {
          [Op.between]: [attainmentDateFrom, endDate],
        },
      },
      {
        course_code: studyPlanCourses,
      },
    ],
    student_studentnumber: {
      [Op.in]: studentnumbers,
    },
  }

  // takes into accout possible progress tests taken earlier than the start date
  const creditsOfStudentLaakis = {
    student_studentnumber: {
      [Op.in]: studentnumbers,
    },
    [Op.or]: [
      {
        attainment_date: {
          [Op.between]: [attainmentDateFrom, endDate],
        },
      },
      {
        course_code: {
          [Op.in]: ['375063', '339101'].concat(studyPlanCourses),
        },
      },
    ],
  }

  const creditsOfStudent = ['320001', 'MH30_001'].includes(studyright[0])
    ? creditsOfStudentLaakis
    : creditsOfStudentOther

  if (studentnumbers.length === 0)
    return { students: [], enrollments: [], credits: [], extents: [], semesters: [], elementdetails: [], courses: [] }

  const [courses, enrollments, students, credits, extents, semesters, elementdetails] = await Promise.all([
    Course.findAll({
      attributes: [sequelize.literal('DISTINCT ON("code") code'), 'name', 'coursetypecode'],
      include: [
        {
          model: Credit,
          attributes: [],
          where: creditsOfStudent,
        },
      ],
      raw: true,
    }),
    Enrollment.findAll({
      attributes: ['course_code', 'state', 'enrollment_date_time', 'studentnumber', 'semestercode'],
      where: {
        enrollment_date_time: {
          [Op.between]: [attainmentDateFrom, endDate],
        },
        studentnumber: {
          [Op.in]: studentnumbers,
        },
        state: ['ENROLLED', 'CONFIRMED'],
      },
      raw: true,
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
        'secondary_email',
        'phone_number',
        'updatedAt',
        'gender_code',
        'birthdate',
        'sis_person_id',
        /* 'gender_fi',
        'gender_sv',
        'gender_en' */
      ],
      include: [
        {
          model: Transfer,
          attributes: ['transferdate', 'sourcecode', 'targetcode'],
          separate: true,
        },
        {
          model: Studyright,
          attributes: [
            'studyrightid',
            'startdate',
            'enddate',
            'extentcode',
            'graduated',
            'active',
            'prioritycode',
            'faculty_code',
            'studystartdate',
            'admission_type',
            'cancelled',
          ],
          separate: true,
          include: [
            {
              model: StudyrightElement,
              required: true,
              attributes: ['id', 'startdate', 'enddate', 'studyrightid', 'code'],
              include: {
                model: ElementDetail,
              },
            },
          ],
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
                [Op.between]: [startDate, endDate],
              },
            },
          },
        },
        {
          model: Studyplan,
          attributes: ['included_courses', 'programme_code', 'completed_credits', 'studyrightid'],
          separate: true,
        },
      ],
      where: {
        studentnumber: {
          [Op.in]: studentnumbers,
        },
      },
    }),
    Credit.findAll({
      attributes: [
        'grade',
        'credits',
        'credittypecode',
        'attainment_date',
        'isStudyModule',
        'student_studentnumber',
        'course_code',
        'language',
      ],
      where: creditsOfStudent,
      raw: true,
    }),
    StudyrightExtent.findAll({
      attributes: [
        sequelize.literal('DISTINCT ON("studyright_extent"."extentcode") "studyright_extent"."extentcode"'),
        'name',
      ],
      include: [
        {
          model: Studyright,
          attributes: [],
          required: true,
          where: {
            student_studentnumber: {
              [Op.in]: studentnumbers,
            },
          },
        },
      ],
      raw: true,
    }),
    Semester.findAll({
      attributes: [
        sequelize.literal('DISTINCT ON("semester"."semestercode") "semester"."semestercode"'),
        'name',
        'startdate',
        'enddate',
      ],
      include: {
        model: SemesterEnrollment,
        attributes: [],
        required: true,
        where: {
          studentnumber: {
            [Op.in]: studentnumbers,
          },
        },
      },
      where: {
        startdate: {
          [Op.between]: [startDate, endDate],
        },
      },
      raw: true,
    }),
    sequelize.query(
      `
SELECT DISTINCT ON (code) code, name, type FROM element_details WHERE
EXISTS (SELECT 1 FROM transfers WHERE studentnumber IN (:studentnumbers) AND (code = sourcecode OR code = targetcode)) OR
EXISTS (SELECT 1 FROM studyright_elements WHERE studentnumber IN (:studentnumbers))`,
      {
        replacements: { studentnumbers },
        type: sequelize.QueryTypes.SELECT,
      }
    ),
  ])

  students.forEach(student => {
    student.tags = studentNumberToTags[student.studentnumber] || []
  })

  return { students, enrollments, credits, extents, semesters, elementdetails, courses }
}

const count = (column, count, distinct = false) => {
  const countable = !distinct ? sequelize.col(column) : sequelize.fn('DISTINCT', sequelize.col(column))
  return sequelize.where(sequelize.fn('COUNT', countable), {
    [Op.eq]: count,
  })
}

const getEarliestYear = async (studentnumberlist, studyRights) => {
  const startdates = await StudyrightElement.findAll({
    attributes: ['startdate'],
    where: {
      studentnumber: {
        [Op.in]: studentnumberlist,
      },
      code: {
        [Op.eq]: studyRights.programme,
      },
    },
  })
  const startyears = startdates.map(l => Number(new Date(l.startdate).getFullYear()))
  return Math.min(...startyears)
}

const studentnumbersWithAllStudyrightElements = async (
  studyRights,
  startDate,
  endDate,
  exchangeStudents,
  nondegreeStudents,
  transferredOutStudents,
  tag,
  transferredToStudents,
  graduatedStudents
) => {
  // eslint-disable-line

  // db startdate is formatted to utc so need to change it when querying
  const formattedStartDate = new Date(moment.tz(startDate, 'Europe/Helsinki').format()).toUTCString()

  const filteredExtents = [16] // always filter out secondary subject students
  let studyrightWhere = {
    extentcode: {
      [Op.notIn]: filteredExtents,
    },
  }
  if (!exchangeStudents) {
    filteredExtents.push(7, 34)
  }
  if (!nondegreeStudents) {
    filteredExtents.push(22, 99, 14, 13)
  }

  let studentWhere = {}
  if (tag) {
    const taggedStudentnumbers = await TagStudent.findAll({
      attributes: ['studentnumber'],
      where: {
        tag_id: tag,
      },
    })
    studentWhere.where = {
      student_studentnumber: {
        [Op.in]: taggedStudentnumbers.map(sn => sn.studentnumber),
      },
    }
  }

  const students = await Studyright.findAll({
    attributes: ['student_studentnumber', 'graduated', 'enddate'],
    include: {
      model: StudyrightElement,
      attributes: [],
      required: true,
      where: {
        code: {
          [Op.in]: studyRights,
        },
      },
      include: {
        model: ElementDetail,
        attributes: [],
      },
    },
    group: [sequelize.col('studyright.studyrightid')],
    where: {
      [Op.or]: [
        {
          ['$studyright_elements->element_detail.type$']: {
            [Op.ne]: 20,
          },
        },
        sequelize.where(
          sequelize.fn(
            'GREATEST',
            sequelize.col('studyright_elements.startdate'),
            sequelize.col('studyright.studystartdate')
          ),
          {
            [Op.between]: [formattedStartDate, endDate],
          }
        ),
      ],
      ...studyrightWhere,
    },
    ...studentWhere,
    having: count('studyright_elements.code', studyRights.length, true),
    raw: true,
  })

  let studentnumbers = [...new Set(students.map(s => s.student_studentnumber))]

  // bit hacky solution, but this is used to filter out studentnumbers who have since changed studytracks
  const rights = await Studyright.findAll({
    attributes: ['studyrightid'],
    where: {
      student_studentnumber: {
        [Op.in]: studentnumbers,
      },
    },
    include: {
      attributes: [],
      model: StudyrightElement,
      where: {
        code: {
          [Op.in]: studyRights,
        },
      },
    },
    group: ['studyright.studyrightid'],
    having: count('studyright_elements.id', studyRights.length, true),
    raw: true,
  })

  // bit hacky solution, but this is used to filter out studentnumbers who have since changed studytracks
  const allStudytracksForStudents = await StudyrightElement.findAll({
    where: {
      studyrightid: {
        [Op.in]: rights.map(r => r.studyrightid),
      },
    },
    include: {
      model: ElementDetail,
      where: {
        type: {
          [Op.eq]: 30,
        },
      },
    },
    raw: true,
  })

  const formattedStudytracks = studentnumbers.reduce((acc, curr) => {
    acc[curr] = allStudytracksForStudents.filter(srE => srE.studentnumber === curr)
    return acc
  }, {})

  // Take the newest studytrack primarily by latest starting date in the track, secondarily by the latest enddate
  const filteredStudentnumbers = studentnumbers.filter(studentnumber => {
    const newestStudytrack = sortBy(formattedStudytracks[studentnumber], ['startdate', 'enddate']).reverse()[0]
    if (!newestStudytrack) return false
    return studyRights.includes(newestStudytrack.code)
  })

  // Use the filtered list, if the search includes studytracks
  // Then the studyrights length is > 1, which means that there is [studyright, studytrack].
  // When searching only for studyprogramme, there is [studyright]
  let studentnumberlist = studyRights.length > 1 ? filteredStudentnumbers : studentnumbers

  // fetch students that have transferred out of the programme and filter out these studentnumbers
  if (!transferredOutStudents) {
    const transfersOut = (
      await Transfer.findAll({
        attributes: ['studentnumber'],
        where: {
          sourcecode: {
            [Op.in]: studyRights,
          },
          transferdate: {
            [Op.gt]: startDate,
          },
          studentnumber: {
            [Op.in]: studentnumberlist,
          },
        },
        raw: true,
      })
    ).map(s => s.studentnumber)

    studentnumberlist = studentnumberlist.filter(sn => !transfersOut.includes(sn))
  }

  // fetch students that have transferred to the programme and filter out these studentnumbers
  if (transferredToStudents) {
    const transfersTo = (
      await Transfer.findAll({
        attributes: ['studentnumber'],
        where: {
          targetcode: {
            [Op.in]: studyRights,
          },
          transferdate: {
            [Op.gt]: startDate,
          },
          studentnumber: {
            [Op.in]: studentnumberlist,
          },
        },
        raw: true,
      })
    ).map(s => s.studentnumber)
    studentnumberlist = studentnumberlist.filter(sn => !transfersTo.includes(sn))
  }

  // fetch students that have graduated from the programme and filter out these studentnumbers
  if (graduatedStudents) {
    const graduated = (
      await Student.findAll({
        attributes: ['studentnumber'],
        include: [
          {
            model: Studyright,
            include: [
              {
                model: StudyrightElement,
                required: true,
                where: {
                  code: {
                    [Op.in]: studyRights,
                  },
                },
              },
            ],
            where: {
              graduated: 1,
            },
          },
        ],
        where: {
          studentnumber: {
            [Op.in]: studentnumbers,
          },
        },
      })
    ).map(s => s.studentnumber)
    studentnumberlist = studentnumberlist.filter(sn => !graduated.includes(sn))
  }

  return studentnumberlist
}

const parseQueryParams = query => {
  const { semesters, studentStatuses, studyRights, months, year, tag } = query
  const startDate = semesters.includes('FALL')
    ? `${year}-${semesterStart[semesters.find(s => s === 'FALL')]}`
    : `${moment(year, 'YYYY').add(1, 'years').format('YYYY')}-${semesterStart[semesters.find(s => s === 'SPRING')]}`
  const endDate = semesters.includes('SPRING')
    ? `${moment(year, 'YYYY').add(1, 'years').format('YYYY')}-${semesterEnd[semesters.find(s => s === 'SPRING')]}`
    : `${year}-${semesterEnd[semesters.find(s => s === 'FALL')]}`
  const exchangeStudents = studentStatuses && studentStatuses.includes('EXCHANGE')
  const nondegreeStudents = studentStatuses && studentStatuses.includes('NONDEGREE')
  const transferredStudents = studentStatuses && studentStatuses.includes('TRANSFERRED')

  return {
    exchangeStudents,
    nondegreeStudents,
    transferredStudents,
    // if someone passes something falsy like null as the studyright, remove it so it doesn't break
    // the sequelize query
    studyRights: (Array.isArray(studyRights) ? studyRights : Object.values(studyRights)).filter(Boolean),
    months,
    startDate,
    endDate,
    tag,
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
            [Op.in]: students,
          },
          code: code,
        },
      },
    ],
    where: {
      ...graduated,
      extentcode: currentExtent,
      student_studentnumber: {
        [Op.in]: students,
      },
    },
    attributes: ['studentStudentnumber', 'givendate'],
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
            [Op.in]: students,
          },
          code: {
            [Op.in]: programmes.map(p => p.code),
          },
        },
        include: [
          {
            model: ElementDetail,
            attributes: ['name'],
          },
        ],
        attributes: ['code', 'startdate'],
      },
    ],
    where: {
      extentcode: optionExtent,
      student_studentnumber: {
        [Op.in]: students,
      },
    },
    order: [[StudyrightElement, 'startdate', 'DESC']],
    attributes: ['studentStudentnumber', 'givendate'],
  })

  return options
    .filter(m => m.studentStudentnumber in currentStudyrightsMap)
    .filter(m => m.givendate.getTime() === currentStudyrightsMap[m.studentStudentnumber].getTime())
    .reduce((obj, element) => {
      obj[element.studentStudentnumber] = {
        code: element.studyright_elements[0].code,
        name: element.studyright_elements[0].element_detail.name,
      }
      return obj
    }, {})
}

const formatStudentsForApi = async (
  { students, enrollments, credits, extents, semesters, elementdetails, courses },
  startDate,
  endDate,
  { studyRights },
  optionData,
  criteria,
  code
) => {
  const startDateMoment = moment(startDate)
  const endDateMoment = moment(endDate)
  elementdetails = elementdetails.reduce(
    (acc, e) => {
      acc.data[e.code] = e
      if (e.type === 20) acc.programmes.push(e.code)
      return acc
    },
    { programmes: [], data: {} }
  )
  credits = credits.reduce((acc, e) => {
    acc[e.student_studentnumber] = acc[e.student_studentnumber] || []
    acc[e.student_studentnumber].push(e)
    return acc
  }, {})
  enrollments = enrollments.reduce((acc, e) => {
    acc[e.studentnumber] = acc[e.studentnumber] || []
    acc[e.studentnumber].push(e)
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
        formatStudentForPopulationStatistics(
          student,
          enrollments,
          credits,
          startDate,
          startDateMoment,
          endDateMoment,
          criteria,
          code
        )
      )
      return stats
    },
    {
      students: [],
      transfers: {
        targets: {},
        sources: {},
      },
      studyrights: {
        programmes: [],
      },
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
    elementdetails,
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
      status => status === 'EXCHANGE' || status === 'NONDEGREE' || status === 'TRANSFERRED'
    )
  ) {
    return { error: 'Student status should be either EXCHANGE or NONDEGREE or TRANSFERRED' }
  }
  const { studyRights, startDate, months, endDate, exchangeStudents, nondegreeStudents, transferredStudents, tag } =
    parseQueryParams(formattedQueryParams)

  // db startdate is formatted to utc so need to change it when querying
  const formattedStartDate = new Date(moment.tz(startDate, 'Europe/Helsinki').format()).toUTCString()

  const studentnumbers = studentnumberlist
    ? studentnumberlist
    : await studentnumbersWithAllStudyrightElements(
        studyRights,
        formattedStartDate,
        endDate,
        exchangeStudents,
        nondegreeStudents,
        transferredStudents
      )
  const code = studyRights[0] || ''
  let optionData = {}
  let criteria = {}
  if (code.includes('MH')) {
    optionData = await getOptionsForStudents(studentnumbers, code, 'MSC')
  } else if (code.includes('KH')) {
    optionData = await getOptionsForStudents(studentnumbers, code, 'BSC')
  }
  if (code.includes('KH') || ['MH30_001', 'MH30_003'].includes(code)) {
    criteria = await getCriteria(code)
  }
  const { students, enrollments, credits, extents, semesters, elementdetails, courses } =
    await getStudentsIncludeCoursesBetween(
      studentnumbers,
      startDate,
      dateMonthsFromNow(startDate, months),
      studyRights,
      tag
    )

  const formattedStudents = await formatStudentsForApi(
    { students, enrollments, credits, extents, semesters, elementdetails, courses },
    startDate,
    endDate,
    formattedQueryParams,
    optionData,
    criteria,
    code
  )

  return formattedStudents
}

const getSubstitutions = async codes => {
  const courses = await Course.findAll({ where: { code: codes }, attributes: ['code', 'substitutions'], raw: true })
  return [...new Set(courses.map(({ code, substitutions }) => [code, ...substitutions]).flat())]
}
// This duplicate code is added here to ensure that we get the enrollments in cases no credits found for the selected students.
const findCourseEnrollments = async (studentnumbers, beforeDate, courses = [], studentCountLimit = 0) => {
  const courseCodes = courses.length > 0 ? await getSubstitutions(courses) : ['DUMMY']
  const res = await sequelize.query(
    `
      SELECT DISTINCT ON (course.id)
        course.code,
        course.name,
        course.coursetypecode,
        course.substitutions,
        course.main_course_code,
        course_types.name AS course_type,
        enrollment.data AS enrollments
      FROM course
      INNER JOIN course_types ON course_types.coursetypecode = course.coursetypecode
      LEFT JOIN (
        SELECT
          course_id,
          ARRAY_AGG(JSON_BUILD_OBJECT(
            'studentnumber', studentnumber,
            'state', state,
            'enrollment_date_time', enrollment_date_time
          )) AS data
        FROM enrollment
        WHERE enrollment.studentnumber IN (:studentnumbers) AND enrollment.enrollment_date_time < :beforeDate
        GROUP BY enrollment.course_id
        HAVING COUNT(DISTINCT enrollment.studentnumber) >= :studentCountLimit
      ) enrollment ON enrollment.course_id = course.id 
      WHERE :skipCourseCodeFilter OR course.code IN (:courseCodes)
      -- GROUP BY 1, 2, 3, 4, 5, 6
    `,
    {
      replacements: {
        studentnumbers: studentnumbers.length > 0 ? studentnumbers : ['DUMMY'],
        beforeDate,
        studentCountLimit,
        courseCodes,
        skipCourseCodeFilter: courses.length === 0,
      },
      type: sequelize.QueryTypes.SELECT,
    }
  )
  return res
}
const findCourses = async (studentnumbers, beforeDate, courses = [], studentCountLimit = 0) => {
  const courseCodes = courses.length > 0 ? await getSubstitutions(courses) : ['DUMMY']
  const res = await sequelize.query(
    `
      SELECT DISTINCT ON (course.id)
        course.code,
        course.name,
        course.coursetypecode,
        course.substitutions,
        course.main_course_code,
        course_types.name AS course_type,
        credit.data AS credits,
        enrollment.data AS enrollments
      FROM course
      INNER JOIN (
        SELECT
          course_code,
          ARRAY_AGG(JSON_BUILD_OBJECT(
            'grade', grade,
            'student_studentnumber', student_studentnumber,
            'attainment_date', attainment_date,
            'credittypecode', credittypecode,
            'course_code', course_code
          )) AS data
        FROM credit
        WHERE student_studentnumber IN (:studentnumbers) AND attainment_date < :beforeDate
        GROUP BY credit.course_code
        HAVING COUNT(DISTINCT credit.student_studentnumber) >= :studentCountLimit
      ) credit ON credit.course_code = course.code
      INNER JOIN course_types ON course_types.coursetypecode = course.coursetypecode
      LEFT JOIN (
        SELECT
          course_id,
          ARRAY_AGG(JSON_BUILD_OBJECT(
            'studentnumber', studentnumber,
            'state', state,
            'enrollment_date_time', enrollment_date_time
          )) AS data
        FROM enrollment
        WHERE enrollment.studentnumber IN (:studentnumbers) AND enrollment.enrollment_date_time < :beforeDate
        GROUP BY enrollment.course_id
      ) enrollment ON enrollment.course_id = course.id 
      WHERE :skipCourseCodeFilter OR course.code IN (:courseCodes)
      -- GROUP BY 1, 2, 3, 4, 5, 6
    `,
    {
      replacements: {
        studentnumbers: studentnumbers.length > 0 ? studentnumbers : ['DUMMY'],
        beforeDate,
        studentCountLimit,
        courseCodes,
        skipCourseCodeFilter: courses.length === 0,
      },
      type: sequelize.QueryTypes.SELECT,
    }
  )

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
  date: credit.attainment_date,
})

const bottlenecksOf = async (query, studentnumberlist, encryptdata = false) => {
  const isValidRequest = async (query, params) => {
    const { studyRights, startDate, endDate, exchangeStudents, nondegreeStudents, transferredStudents } = params

    if (!query.semesters.every(semester => semester === 'FALL' || semester === 'SPRING')) {
      return { error: 'Semester should be either SPRING OR FALL' }
    }
    if (
      query.studentStatuses &&
      !query.studentStatuses.every(
        status => status === 'EXCHANGE' || status === 'NONDEGREE' || status === 'TRANSFERRED'
      )
    ) {
      return { error: 'Student status should be either EXCHANGE or NONDEGREE or TRANSFERRED' }
    }
    if (query.selectedStudents) {
      const allStudents = await studentnumbersWithAllStudyrightElements(
        studyRights,
        startDate,
        endDate,
        exchangeStudents,
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

  const getStudentsAndCourses = async (selectedStudents, studentnumberlist, courseCodes) => {
    if (!studentnumberlist) {
      const { months, studyRights, startDate, endDate, exchangeStudents, nondegreeStudents, transferredStudents, tag } =
        params
      const studentnumbers =
        selectedStudents ||
        (await studentnumbersWithAllStudyrightElements(
          studyRights,
          startDate,
          endDate,
          exchangeStudents,
          nondegreeStudents,
          transferredStudents,
          tag
        ))

      const allstudents = studentnumbers.reduce((numbers, num) => {
        numbers[num] = true
        return numbers
      }, {})
      const courses = await findCourses(
        studentnumbers,
        dateMonthsFromNow(startDate, months),
        courseCodes,
        query.studentCountLimit
      )
      const foundCourseCodes = Object.keys(keyBy(courses, 'code'))
      const filteredCourseCodes = courseCodes?.filter(code => !foundCourseCodes.includes(code))

      const courseEnrollements = await findCourseEnrollments(
        studentnumbers,
        dateMonthsFromNow(startDate, months),
        filteredCourseCodes,
        query.studentCountLimit
      )
      return [allstudents, courses, courseEnrollements]
    } else {
      const { months, startDate } = params
      const beforeDate = months && startDate ? dateMonthsFromNow(startDate, months) : new Date()

      const allstudents = studentnumberlist.reduce((numbers, num) => {
        numbers[num] = true
        return numbers
      }, {})
      const courses = await findCourses(studentnumberlist, beforeDate, courseCodes, query.studentCountLimit)
      const foundCourseCodes = Object.keys(keyBy(courses, 'code'))
      const filteredCourseCodes = courseCodes?.filter(code => !foundCourseCodes.includes(code))

      const courseEnrollements = await findCourseEnrollments(
        studentnumberlist,
        dateMonthsFromNow(startDate, months),
        filteredCourseCodes,
        query.studentCountLimit
      )
      return [allstudents, courses, courseEnrollements]
    }
  }

  const encryptStudentnumbers = bottlenecks => {
    for (const course in bottlenecks.coursestatistics) {
      const encryptedStudentStats = {}
      for (const data in bottlenecks.coursestatistics[course].students) {
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
  const [[allstudents, courses, courseEnrollements], [, allCourses], error] = await Promise.all([
    getStudentsAndCourses(query.selectedStudents, studentnumberlist, query.courses),
    getStudentsAndCourses(allStudentsByYears, null, query.courses),
    isValidRequest(query, params),
  ])

  if (error) return error
  // Get the substitution codes for the fetch data by selscted students
  const substitutionCodes = Object.entries(courses).reduce(
    (res, [, obj]) => [...res, ...(obj?.substitutions || [])],
    []
  )
  const codes = Object.keys(keyBy(courses, 'code')).map(code => code)
  // Filter substitution courses for fetched courses -> this avoid the situation in which there is only
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
    let { course_type } = course
    let maincourse = course

    if (course.main_course_code && course.main_course_code !== course.code) {
      let newmain = coursesByCode[course.main_course_code]

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
  studentnumbersWithAllStudyrightElements,
  universityEnrolmentDates,
  optimizedStatisticsOf,
  bottlenecksOf,
  getEarliestYear,
}
