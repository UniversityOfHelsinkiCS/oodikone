import { orderBy } from 'lodash'
import moment from 'moment'
import { Op, QueryTypes } from 'sequelize'

import { dbConnections } from '../../database/connection'
import { Course, Credit, SISStudyRight, SISStudyRightElement } from '../../models'
import { Criteria, Name } from '../../types'
import { SemesterStart } from '../../util/semester'
import { getCurrentSemester } from '../semesters'

const { sequelize } = dbConnections

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
  // TODO: Clean up this mess
  if (
    criteria?.courses &&
    criteria?.courses[criteriaYear] &&
    (criteria.courses[criteriaYear].includes(course.course_code) ||
      criteria.courses[criteriaYear].some(
        criteriaCourse =>
          criteria.allCourses[criteriaCourse] && criteria.allCourses[criteriaCourse].includes(course.course_code)
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

const updateCreditCriteriaInfo = (criteria, criteriaYear, criteriaChecked, yearToAdd, academicYears, academicYear) => {
  if (!criteria.courses) {
    return
  }
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

export const getCurriculumVersion = (curriculumPeriodId: string) => {
  if (!curriculumPeriodId) {
    return null
  }
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
    studyRights,
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
    const attainmentDateNormalized =
      attainment_date < startDate ? startDateMoment.clone().add(1, 'day').toISOString() : attainment_date
    const passed = Credit.passed({ credittypecode })

    return {
      course_code,
      date: attainmentDateNormalized,
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
    ? Object.keys(criteria.allCourses).reduce((acc, courseCode) => {
        acc[courseCode] = courseCode
        criteria.allCourses[courseCode].forEach(substitutionCode => {
          acc[substitutionCode] = courseCode
        })
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

    updateCreditCriteriaInfo(criteria, 'yearOne', criteriaChecked, 'year1', academicYears, 'first')
    updateCreditCriteriaInfo(criteria, 'yearTwo', criteriaChecked, 'year2', academicYears, 'second')
    updateCreditCriteriaInfo(criteria, 'yearThree', criteriaChecked, 'year3', academicYears, 'third')
    updateCreditCriteriaInfo(criteria, 'yearFour', criteriaChecked, 'year4', academicYears, 'fourth')
    updateCreditCriteriaInfo(criteria, 'yearFive', criteriaChecked, 'year5', academicYears, 'fifth')
    updateCreditCriteriaInfo(criteria, 'yearSix', criteriaChecked, 'year6', academicYears, 'sixth')
    return criteriaChecked
  }

  const started = dateofuniversityenrollment

  return {
    firstnames,
    lastname,
    studyRights,
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

export const dateMonthsFromNow = (date: string, months: number) => {
  return new Date(moment(date).add(months, 'months').format('YYYY-MM-DD'))
}

export const parseQueryParams = query => {
  const { semesters, studentStatuses, studyRights, months, year, tag } = query
  const hasFall = semesters.includes('FALL')
  const hasSpring = semesters.includes('SPRING')

  const startDate = hasFall
    ? new Date(`${year}-${SemesterStart.FALL}`).toISOString()
    : new Date(`${year + 1}-${SemesterStart.SPRING}`).toISOString()

  const endDate = hasSpring
    ? new Date(`${year + 1}-${SemesterStart.FALL}`).toISOString()
    : new Date(`${year + 1}-${SemesterStart.SPRING}`).toISOString()

  const exchangeStudents = studentStatuses != null && studentStatuses.includes('EXCHANGE')
  const nondegreeStudents = studentStatuses != null && studentStatuses.includes('NONDEGREE')
  const transferredStudents = studentStatuses != null && studentStatuses.includes('TRANSFERRED')

  return {
    exchangeStudents,
    nondegreeStudents,
    transferredStudents,
    // Remove falsy values so the query doesn't break
    studyRights: (Array.isArray(studyRights) ? studyRights : Object.values(studyRights)).filter(Boolean),
    months,
    startDate,
    endDate,
    tag,
  }
}

export const getOptionsForStudents = async (studentNumbers: string[], code: string, level: 'BSC' | 'MSC') => {
  if (!code || !studentNumbers.length) {
    return {}
  }

  if (!['BSC', 'MSC'].includes(level)) {
    throw new Error(`Invalid study level ${level}`)
  }

  const studyRightElementsForStudyRight = await SISStudyRightElement.findAll({
    attributes: [],
    where: {
      code,
    },
    include: [
      {
        model: SISStudyRight,
        attributes: ['studentNumber'],
        where: {
          studentNumber: {
            [Op.in]: studentNumbers,
          },
        },
        include: [
          {
            model: SISStudyRightElement,
            attributes: ['code', 'name', 'degreeProgrammeType', 'startDate', 'endDate'],
          },
        ],
      },
    ],
  })

  return studyRightElementsForStudyRight.reduce<Record<string, { name: Name }>>((acc, { studyRight }) => {
    let programme: SISStudyRightElement | null = null

    if (level === 'MSC') {
      const [latestBachelorsProgramme] = orderBy(
        studyRight.studyRightElements.filter(
          element => element.degreeProgrammeType === 'urn:code:degree-program-type:bachelors-degree'
        ),
        ['endDate'],
        ['desc']
      )
      programme = latestBachelorsProgramme
    } else if (level === 'BSC') {
      const [firstMastersProgramme] = orderBy(
        studyRight.studyRightElements.filter(
          element => element.degreeProgrammeType === 'urn:code:degree-program-type:masters-degree'
        ),
        ['startDate'],
        ['asc']
      )
      programme = firstMastersProgramme
    }

    if (programme) {
      acc[studyRight.studentNumber] = { name: programme.name }
    }

    return acc
  }, {})
}

export const formatStudentsForApi = async (
  { students, enrollments, credits, extents, semesters, courses },
  startDate: string,
  endDate: string,
  studyRights: string[],
  optionData: Record<string, { name: Name }>,
  criteria: Criteria,
  code: string
) => {
  const startDateMoment = moment(startDate)
  const endDateMoment = moment(endDate)
  const currentSemester = (await getCurrentSemester()).semestercode

  credits = credits.reduce((acc, credit) => {
    acc[credit.student_studentnumber] = acc[credit.student_studentnumber] || []
    acc[credit.student_studentnumber].push(credit)
    return acc
  }, {})
  enrollments = enrollments.reduce((acc, enrollment) => {
    acc[enrollment.studentnumber] = acc[enrollment.studentnumber] || []
    acc[enrollment.studentnumber].push(enrollment)
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

  const transferredStudyright = student => {
    const transferredFrom = student.transfers.find(
      transfer =>
        transfer.targetcode === studyRights[0] &&
        // Add bit of flex for students that transferred just before the startdate
        moment(transfer.transferdate).isBetween(startDateMoment.subtract(1, 'd'), endDateMoment.add(1, 'd'))
    )
    if (transferredFrom) {
      student.transferredStudyright = true
      student.transferSource = transferredFrom.sourcecode
    } else {
      student.transferredStudyright = false
      student.transferSource = null
    }
    return student
  }

  return {
    students: result.students.map(transferredStudyright),
    transfers: result.transfers,
    extents,
    semesters,
    courses,
  }
}

export const formatQueryParamsToArrays = (query: Record<string, any>, params: string[]) => {
  const result = { ...query }
  params.forEach(param => {
    if (!result[param]) {
      return
    }
    result[param] = Array.isArray(result[param]) ? result[param] : [result[param]]
  })
  return result
}

const getSubstitutions = async (codes: string[]) => {
  const courses = await Course.findAll({
    attributes: ['code', 'substitutions'],
    where: { code: codes },
    raw: true,
  })

  const substitutions = [
    ...new Set(courses.flatMap(({ code, substitutions }) => [code, ...Object.values(substitutions).flat()])),
  ]

  return substitutions
}

const getCourseCodes = async (courses: string[]) => {
  if (courses.length === 0) {
    return ['DUMMY']
  }
  const courseCodes = await getSubstitutions(courses)
  return courseCodes
}

// This duplicate code is added here to ensure that we get the enrollments in cases no credits found for the selected students
export const findCourseEnrollments = async (studentNumbers: string[], beforeDate: Date, courses: string[] = []) => {
  const courseCodes = await getCourseCodes(courses)
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
        studentnumbers: studentNumbers.length > 0 ? studentNumbers : ['DUMMY'],
        beforeDate,
        courseCodes,
        skipCourseCodeFilter: courses.length === 0,
      },
      type: QueryTypes.SELECT,
    }
  )
  return res
}

export const findCourses = async (studentNumbers: string[], beforeDate: Date, courses: string[] = []) => {
  const courseCodes = await getCourseCodes(courses)
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
        studentnumbers: studentNumbers.length > 0 ? studentNumbers : ['DUMMY'],
        beforeDate,
        courseCodes,
        skipCourseCodeFilter: courses.length === 0,
      },
      type: QueryTypes.SELECT,
    }
  )

  return res
}

export const parseCreditInfo = (credit: Credit) => ({
  studentnumber: credit.student_studentnumber,
  grade: credit.grade,
  passingGrade: Credit.passed(credit),
  failingGrade: Credit.failed(credit),
  improvedGrade: Credit.improved(credit),
  date: credit.attainment_date,
})
