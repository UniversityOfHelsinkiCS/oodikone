import { orderBy } from 'lodash'
import moment from 'moment'
import { Op, QueryTypes } from 'sequelize'

import { Name } from '@shared/types'
import { dbConnections } from '../../database/connection'
import { Course, Credit, Enrollment, SISStudyRight, SISStudyRightElement, Student, Studyplan } from '../../models'
import { Tag, TagStudent } from '../../models/kone'
import { Criteria, DegreeProgrammeType, EnrollmentState, ParsedCourse } from '../../types'
import { SemesterStart } from '../../util/semester'
import { hasTransferredFromOrToProgramme } from '../studyProgramme/studyProgrammeHelpers'

const { sequelize } = dbConnections

type CoursesSatisfied = Record<string, string | null>

type CriteriaYear = {
  credits: boolean
  totalSatisfied: number
  coursesSatisfied: CoursesSatisfied
}

const createEmptyCriteriaYear = (criteria: Criteria, year: string): CriteriaYear => {
  const coursesSatisfied: CoursesSatisfied = criteria?.courses?.[year]
    ? criteria.courses[year]?.reduce((acc: CoursesSatisfied, course: string) => {
        acc[course] = null
        return acc
      }, {} as CoursesSatisfied)
    : {}
  return {
    credits: false,
    totalSatisfied: 0,
    coursesSatisfied,
  }
}

const getCreditAmount = (
  course: ParsedCourse,
  hops: Studyplan[],
  courseCode: string,
  startDate: string,
  addition: number
) => {
  return moment(course.date).isBetween(moment(startDate), moment(startDate).add(addition, 'year')) &&
    hops.length > 0 &&
    (hops[0].included_courses.includes(courseCode) || hops[0].included_courses.includes(course.course_code))
    ? course.credits
    : 0
}

const updateCourseByYear = (
  criteria: Criteria,
  criteriaYear: string,
  course: ParsedCourse,
  criteriaChecked: Record<string, CriteriaYear>,
  yearToAdd: string,
  correctCode: string
) => {
  // TODO: Clean up this mess
  if (
    criteria?.courses?.[criteriaYear] &&
    (criteria.courses[criteriaYear].includes(course.course_code) ||
      criteria.courses[criteriaYear].some((criteriaCourse: string) =>
        criteria.allCourses[criteriaCourse]?.includes(course.course_code)
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

const updateCreditCriteriaInfo = (
  criteria: Criteria,
  criteriaYear: string,
  criteriaChecked: Record<string, CriteriaYear>,
  yearToAdd: string,
  academicYears: Record<string, number>,
  academicYear: string
) => {
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
  student: Student & { tags?: TagStudent[] },
  enrollments: Record<string, Enrollment[]>,
  credits: Record<string, Credit[]>,
  startDate: string,
  startDateMoment: moment.Moment,
  endDateMoment: moment.Moment,
  criteria: Criteria,
  code: string,
  optionData: Record<string, { name: Name }>
) => {
  const toCourse = (credit: Credit, normalizeDate: boolean): ParsedCourse => {
    const attainmentDateNormalized =
      normalizeDate && credit.attainment_date < new Date(startDate)
        ? startDateMoment.clone().add(1, 'day').toISOString()
        : credit.attainment_date.toISOString()
    const passed =
      Credit.passed({ credittypecode: credit.credittypecode }) ||
      Credit.improved({ credittypecode: credit.credittypecode })

    return {
      course_code: credit.course_code,
      date: attainmentDateNormalized,
      passed,
      grade: passed ? credit.grade : 'Hyl.',
      credits: credit.credits,
      isStudyModuleCredit: credit.isStudyModule,
      credittypecode: credit.credittypecode,
      language: credit.language,
      studyright_id: credit.studyright_id,
    }
  }

  const {
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
    updatedAt,
    createdAt,
    gender_code,
    tags,
    birthdate,
    sis_person_id,
    home_country_fi,
    home_country_sv,
    home_country_en,
  } = student

  const criteriaCoursesBySubstitutions = criteria?.allCourses
    ? Object.keys(criteria.allCourses).reduce(
        (acc, courseCode) => {
          acc[courseCode] = courseCode
          criteria.allCourses[courseCode].forEach(substitutionCode => {
            acc[substitutionCode] = courseCode
          })
          return acc
        },
        {} as Record<string, string>
      )
    : ({} as Record<string, string>)

  const correctStudyplan = studyplans ? studyplans.filter(plan => plan.programme_code === code) : []

  const option = studentnumber in optionData ? optionData[studentnumber] : null

  let transferredStudyright = false
  let transferSource: string | null = null

  if (code) {
    const correctStudyRight = studyRights.find(studyRight =>
      studyRight.studyRightElements.some(element => element.code === code)
    )
    if (correctStudyRight) {
      const correctStudyRightElement = correctStudyRight.studyRightElements.find(element => element.code === code)
      const [, hasTransferredToProgramme] = hasTransferredFromOrToProgramme(
        correctStudyRight,
        correctStudyRightElement!
      )
      if (hasTransferredToProgramme) {
        const transferredFromProgramme = correctStudyRight.studyRightElements.find(element =>
          moment(element.endDate).isSame(moment(correctStudyRightElement?.startDate).subtract(1, 'd'), 'day')
        )?.code
        if (transferredFromProgramme) {
          transferredStudyright = true
          transferSource = transferredFromProgramme
        }
      }
    }
  }

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
      const courses = credits[studentnumber] ? credits[studentnumber].map(credit => toCourse(credit, true)) : []
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
    courses: credits[studentnumber] ? credits[studentnumber].map(credit => toCourse(credit, false)) : [],
    enrollments: enrollments[studentnumber],
    name: abbreviatedname,
    gender_code,
    email,
    secondaryEmail: secondary_email,
    phoneNumber: phone_number,
    updatedAt: updatedAt || createdAt,
    tags: tags ?? [],
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
    transferredStudyright,
    transferSource,
  }
}

export const dateMonthsFromNow = (date: string, months: number) => {
  return new Date(moment(date).add(months, 'months').format('YYYY-MM-DD'))
}

export type Query = {
  year: string
  months: number
  semesters: string[]
  studyRights: string | string[]
  selectedStudents?: string[]
  selectedStudentsByYear?: Record<string, string[]>
  studentStatuses?: string[]
  years?: string[]
  tag?: string
  courses?: string[]
}

export type Params = {
  startDate: string
  endDate: string
  exchangeStudents: boolean
  nondegreeStudents: boolean
  transferredStudents: boolean
  studyRights: string[]
  months: number
  tag?: Tag
}

export const parseQueryParams = (query: Query) => {
  const { semesters, studentStatuses, studyRights, months, year, tag } = query
  const hasFall = semesters.includes('FALL')
  const hasSpring = semesters.includes('SPRING')

  const startDate = hasFall
    ? new Date(`${year}-${SemesterStart.FALL}`).toISOString()
    : new Date(`${year + 1}-${SemesterStart.SPRING}`).toISOString()

  const endDate = hasSpring
    ? new Date(`${year + 1}-${SemesterStart.FALL}`).toISOString()
    : new Date(`${year + 1}-${SemesterStart.SPRING}`).toISOString()

  const exchangeStudents = studentStatuses?.includes('EXCHANGE')
  const nondegreeStudents = studentStatuses?.includes('NONDEGREE')
  const transferredStudents = studentStatuses?.includes('TRANSFERRED')

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
  } as Params
}

export const getOptionsForStudents = async (
  studentNumbers: string[],
  code: string,
  level: DegreeProgrammeType.BACHELOR | DegreeProgrammeType.MASTER
) => {
  if (!code || !studentNumbers.length) {
    return {}
  }

  if (![DegreeProgrammeType.BACHELOR, DegreeProgrammeType.MASTER].includes(level)) {
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

    if (level === DegreeProgrammeType.MASTER) {
      const [latestBachelorsProgramme] = orderBy(
        studyRight.studyRightElements.filter(element => element.degreeProgrammeType === DegreeProgrammeType.BACHELOR),
        ['endDate'],
        ['desc']
      )
      programme = latestBachelorsProgramme
    } else {
      const [firstMastersProgramme] = orderBy(
        studyRight.studyRightElements.filter(element => element.degreeProgrammeType === DegreeProgrammeType.MASTER),
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

export const formatStudentsForApi = (
  students: Array<Student & { tags?: TagStudent[] }>,
  enrollments: Enrollment[],
  credits: Credit[],
  courses: Course[],
  startDate: string,
  endDate: string,
  optionData: Record<string, { name: Name }>,
  criteria: Criteria,
  code: string
) => {
  const startDateMoment = moment(startDate)
  const endDateMoment = moment(endDate)

  const creditsByStudent = credits.reduce(
    (acc, credit) => {
      acc[credit.student_studentnumber] = acc[credit.student_studentnumber] || []
      acc[credit.student_studentnumber].push(credit)
      return acc
    },
    {} as Record<string, Credit[]>
  )
  const enrollmentsByStudent = enrollments.reduce(
    (acc, enrollment) => {
      acc[enrollment.studentnumber] = acc[enrollment.studentnumber] || []
      acc[enrollment.studentnumber].push(enrollment)
      return acc
    },
    {} as Record<string, Enrollment[]>
  )

  return {
    students: students.map(student =>
      formatStudentForPopulationStatistics(
        student,
        enrollmentsByStudent,
        creditsByStudent,
        startDate,
        startDateMoment,
        endDateMoment,
        criteria,
        code,
        optionData
      )
    ),
    courses,
  }
}

const getSubstitutions = async (codes: string[]) => {
  const courses = await Course.findAll({
    attributes: ['code', 'substitutions'],
    where: {
      code: {
        [Op.iLike]: { [Op.any]: codes },
      },
    },
    raw: true,
  })

  const substitutions = [
    ...new Set(courses.flatMap(({ code, substitutions }) => [code, ...Object.values(substitutions).flat()])),
  ]

  return substitutions
}

export type EnrollmentsQueryResult = Array<{
  code: string
  name: Name
  substitutions: string[]
  main_course_code: string
  enrollments: Array<Pick<Enrollment, 'studentnumber' | 'state' | 'enrollment_date_time'>> | null
}>

type CreditPick = Pick<Credit, 'grade' | 'student_studentnumber' | 'attainment_date' | 'credittypecode' | 'course_code'>

export type CoursesQueryResult = Array<
  EnrollmentsQueryResult[number] & {
    credits: Array<CreditPick>
  }
>

// This duplicate code is added here to ensure that we get the enrollments in cases no credits found for the selected students
export const findCourseEnrollments = async (studentNumbers: string[], beforeDate: Date, courses: string[] = []) => {
  const courseCodes = courses.length === 0 ? ['DUMMY'] : await getSubstitutions(courses)
  const result: EnrollmentsQueryResult = await sequelize.query(
    `
      SELECT DISTINCT ON (course.id)
        course.code,
        course.name,
        course.substitutions,
        course.main_course_code,
        enrollment.data AS enrollments
      FROM course
      INNER JOIN (
        SELECT
          course_id,
          ARRAY_AGG(JSON_BUILD_OBJECT(
            'studentnumber', studentnumber,
            'state', state,
            'enrollment_date_time', enrollment_date_time
          )) AS data
        FROM enrollment
        WHERE enrollment.studentnumber IN (:studentnumbers) AND enrollment.enrollment_date_time < :beforeDate AND enrollment.state = :enrollmentState
        GROUP BY enrollment.course_id
      ) enrollment ON enrollment.course_id = course.id 
      WHERE :skipCourseCodeFilter OR course.code IN (:courseCodes)
    `,
    {
      replacements: {
        studentnumbers: studentNumbers.length > 0 ? studentNumbers : ['DUMMY'],
        beforeDate,
        courseCodes,
        skipCourseCodeFilter: courses.length === 0,
        enrollmentState: EnrollmentState.ENROLLED,
      },
      type: QueryTypes.SELECT,
    }
  )
  return result
}

export const findCourses = async (studentNumbers: string[], beforeDate: Date, courses: string[] = []) => {
  const courseCodes = courses.length === 0 ? ['DUMMY'] : await getSubstitutions(courses)
  const result: CoursesQueryResult = await sequelize.query(
    `
      SELECT DISTINCT ON (course.id)
        course.code,
        course.name,
        course.substitutions,
        course.main_course_code,
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
      LEFT JOIN (
        SELECT
          course_id,
          ARRAY_AGG(JSON_BUILD_OBJECT(
            'studentnumber', studentnumber,
            'state', state,
            'enrollment_date_time', enrollment_date_time
          )) AS data
        FROM enrollment
        WHERE enrollment.studentnumber IN (:studentnumbers) AND enrollment.enrollment_date_time < :beforeDate AND enrollment.state = :enrollmentState
        GROUP BY enrollment.course_id
      ) enrollment ON enrollment.course_id = course.id 
      WHERE :skipCourseCodeFilter OR course.code IN (:courseCodes)
    `,
    {
      replacements: {
        studentnumbers: studentNumbers.length > 0 ? studentNumbers : ['DUMMY'],
        beforeDate,
        courseCodes,
        skipCourseCodeFilter: courses.length === 0,
        enrollmentState: EnrollmentState.ENROLLED,
      },
      type: QueryTypes.SELECT,
    }
  )
  return result
}

export const parseCreditInfo = (credit: CreditPick) => {
  return {
    studentnumber: credit.student_studentnumber,
    grade: credit.grade,
    passingGrade: Credit.passed(credit),
    failingGrade: Credit.failed(credit),
    improvedGrade: Credit.improved(credit),
    date: credit.attainment_date,
  }
}
