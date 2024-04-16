const { Op } = require('sequelize')
const moment = require('moment')
const { Credit, Course, Studyright, ElementDetail, StudyrightElement } = require('../../models')
const {
  dbConnections: { sequelize },
} = require('../../database/connection')
const { semesterEnd, semesterStart } = require('../../util/semester')
const { getAllProgrammes } = require('../studyrights')
const { getCurrentSemester } = require('../semesters')

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

const getCurriculumVersion = curriculumPeriodId => {
  if (!curriculumPeriodId) return null
  const versionNumber = parseInt(curriculumPeriodId.slice(-2), 10)
  const year = versionNumber + 1949
  const startYear = Math.floor((year - 1) / 3) * 3 + 1
  const endYear = startYear + 3
  const curriculumVersion = `${startYear}-${endYear}`
  return curriculumVersion
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
    tags,
    option,
    birthdate,
    sis_person_id,
    home_country_fi,
    home_country_sv,
    home_country_en,
  },
  enrollments,
  credits,
  startDate,
  startDateMoment,
  endDateMoment,
  criteria,
  code,
  currentSemester
) => {
  const toCourse = ({
    grade,
    attainment_date,
    credits,
    course_code,
    credittypecode,
    isStudyModule,
    language,
    studyright_id,
  }) => {
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
      studyright_id,
    }
  }
  const criteriaCoursesBySubstitutions = criteria?.allCourses
    ? Object.keys(criteria.allCourses).reduce((acc, code) => {
        acc[code] = code
        // TODO: Check this line, arrow functions shouldn't return assignments
        // eslint-disable-next-line no-return-assign
        criteria.allCourses[code].map(subst => (acc[subst] = code))
        return acc
      }, {})
    : {}

  const correctStudyplan = studyplans ? studyplans.filter(plan => plan.programme_code === code) : []

  const toProgressCriteria = () => {
    const criteriaChecked = {
      year1: createEmptyCriteriaYear(criteria, 'yearOne'),
      year2: createEmptyCriteriaYear(criteria, 'yearTwo'),
      year3: createEmptyCriteriaYear(criteria, 'yearThree'),
      year4: createEmptyCriteriaYear(criteria, 'yearFour'),
      year5: createEmptyCriteriaYear(criteria, 'yearFive'),
      year6: createEmptyCriteriaYear(criteria, 'yearSix'),
    }

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
    email,
    secondaryEmail: secondary_email,
    phoneNumber: phone_number,
    semesterenrollments: semester_enrollments
      ? semester_enrollments
          .sort((a, b) => a.semestercode - b.semestercode)
          .filter(enrollment => enrollment.semestercode <= currentSemester + (currentSemester % 2))
      : [],
    updatedAt: updatedAt || createdAt,
    tags: tags || [],
    studyrightStart: startDate,
    starting: moment(started).isBetween(startDateMoment, endDateMoment, null, '[]'),
    option,
    birthdate,
    studyplans,
    sis_person_id,
    home_country_en,
    home_country_fi,
    home_country_sv,
    criteriaProgress: toProgressCriteria(),
    curriculumVersion: getCurriculumVersion(correctStudyplan[0]?.curriculum_period_id),
  }
}

const dateMonthsFromNow = (date, months) => moment(date).add(months, 'months').format('YYYY-MM-DD')

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
    throw new Error(`Invalid study level ${level}`)
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
          code,
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
  const currentSemester = (await getCurrentSemester()).semestercode

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

      if (student.studentnumber in optionData) {
        student.option = optionData[student.studentnumber]
      } else {
        student.option = null
      }

      stats.students.push(
        formatStudentForPopulationStatistics(
          student,
          enrollments,
          credits,
          startDate,
          startDateMoment,
          endDateMoment,
          criteria,
          code,
          currentSemester
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
  const res = { ...query }
  params.forEach(p => {
    if (!res[p]) return
    res[p] = Array.isArray(res[p]) ? res[p] : [res[p]]
  })
  return res
}

const getSubstitutions = async codes => {
  const courses = await Course.findAll({ where: { code: codes }, attributes: ['code', 'substitutions'], raw: true })
  return [...new Set(courses.map(({ code, substitutions }) => [code, ...substitutions]).flat())]
}

// This duplicate code is added here to ensure that we get the enrollments in cases no credits found for the selected students.
const findCourseEnrollments = async (studentnumbers, beforeDate, courses = []) => {
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
      ) enrollment ON enrollment.course_id = course.id 
      WHERE :skipCourseCodeFilter OR course.code IN (:courseCodes)
      -- GROUP BY 1, 2, 3, 4, 5, 6
    `,
    {
      replacements: {
        studentnumbers: studentnumbers.length > 0 ? studentnumbers : ['DUMMY'],
        beforeDate,
        courseCodes,
        skipCourseCodeFilter: courses.length === 0,
      },
      type: sequelize.QueryTypes.SELECT,
    }
  )
  return res
}

const findCourses = async (studentnumbers, beforeDate, courses = []) => {
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

module.exports = {
  count,
  parseCreditInfo,
  checkThatSelectedStudentsAreUnderRequestedStudyright,
  findCourses,
  findCourseEnrollments,
  formatQueryParamArrays,
  formatStudentsForApi,
  parseQueryParams,
  getOptionsForStudents,
  dateMonthsFromNow,
  getEarliestYear,
}
