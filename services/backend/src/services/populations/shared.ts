import { orderBy } from 'lodash'
import { Op, QueryTypes } from 'sequelize'

import { dbConnections } from '../../database/connection'
import { Course, Credit, Enrollment, SISStudyRight, SISStudyRightElement, Student, Studyplan } from '../../models'
import { TagStudent } from '../../models/kone'
import { Name, ProgressCriteria } from '../../shared/types'
import { formatToArray } from '../../shared/util'
import { DegreeProgrammeType, EnrollmentState, ParsedCourse } from '../../types'
import { dateYearsFromNow, dateDaysFromNow } from '../../util/datetime'
import { SemesterStart } from '../../util/semester'
import { hasTransferredFromOrToProgramme } from '../studyProgramme/studyProgrammeHelpers'

const { sequelize } = dbConnections

type CoursesSatisfied = Record<string, string | null>

type CriteriaYear = {
  credits: boolean
  totalSatisfied: number
  coursesSatisfied: CoursesSatisfied
}

const createEmptyCriteriaYear = (criteria: ProgressCriteria, year: string): CriteriaYear => {
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

const getCreditAmount = (course: ParsedCourse, hops: Studyplan[], courseCode: string, startDate: string) => {
  const courseDate = new Date(course.date)
  const startDateFromString = new Date(startDate)

  const creditAmounts = [0, 0, 0, 0, 0, 0]

  for (let i = 1; i <= 6; i++) {
    if (
      courseDate > startDateFromString &&
      courseDate < dateYearsFromNow(startDateFromString, i) &&
      hops.length > 0 &&
      (hops[0].included_courses.includes(courseCode) || hops[0].included_courses.includes(course.course_code))
    ) {
      creditAmounts[i - 1] = course.credits
    }
  }
  return creditAmounts
}

const updateCourseByYear = (
  criteria: ProgressCriteria,
  course: ParsedCourse,
  criteriaChecked: Record<string, CriteriaYear>,
  correctCode: string
) => {
  const yearMap = [
    { criteriaYear: 'yearOne', yearToAdd: 'year1' },
    { criteriaYear: 'yearTwo', yearToAdd: 'year2' },
    { criteriaYear: 'yearThree', yearToAdd: 'year3' },
    { criteriaYear: 'yearFour', yearToAdd: 'year4' },
    { criteriaYear: 'yearFive', yearToAdd: 'year5' },
    { criteriaYear: 'yearSix', yearToAdd: 'year6' },
  ]

  const courseSets = yearMap.reduce(
    (acc, { criteriaYear }) => {
      const yearCourses = criteria?.courses?.[criteriaYear] || []
      const expandedCodes = new Set<string>()

      yearCourses.forEach((mainCode: string) => {
        expandedCodes.add(mainCode)

        criteria.allCourses[mainCode]?.forEach((subCode: string) => {
          expandedCodes.add(subCode)
        })
      })

      acc[criteriaYear] = expandedCodes
      return acc
    },
    {} as Record<string, Set<string>>
  )

  yearMap.forEach(({ criteriaYear, yearToAdd }) => {
    const yearSet = courseSets[criteriaYear]

    if (yearSet?.has(course.course_code)) {
      const currentDate = criteriaChecked[yearToAdd].coursesSatisfied[correctCode]
      if (!currentDate || new Date(currentDate) > new Date(course.date)) {
        criteriaChecked[yearToAdd].coursesSatisfied[correctCode] = course.date
      }
    }
  })
}

const updateCreditCriteriaInfo = (
  criteria: ProgressCriteria,
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
  endDate: string,
  criteria: ProgressCriteria,
  code: string,
  optionData: Record<string, { name: Name }>
) => {
  const startDateFromISO = new Date(startDate)
  const endDateFromISO = new Date(endDate)

  const toCourse = (credit: Credit, normalizeDate: boolean): ParsedCourse => {
    const attainmentDateNormalized =
      normalizeDate && credit.attainment_date < startDateFromISO
        ? dateDaysFromNow(startDateFromISO, 1).toISOString()
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
    citizenships,
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
        const transferredFromProgramme = correctStudyRight.studyRightElements.find(element => {
          const studyRightStart = new Date(correctStudyRightElement?.startDate ?? 0)
          const studyRightEndDate = new Date(element.endDate)
          const studyRightStartDate = dateDaysFromNow(studyRightStart, -1)
          return (
            studyRightStartDate.getFullYear() === studyRightEndDate.getFullYear() &&
            studyRightStartDate.getMonth() === studyRightEndDate.getMonth() &&
            studyRightStartDate.getDate() === studyRightEndDate.getDate()
          )
        })?.code
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

      courses
        .filter(course => course.passed)
        .forEach(course => {
          const correctCode = criteriaCoursesBySubstitutions[course.course_code]

          updateCourseByYear(criteria, course, criteriaChecked, correctCode)

          const creditAmounts = getCreditAmount(course, correctStudyplan, correctCode, startDate)

          Object.keys(academicYears).forEach((year, index) => {
            academicYears[year] += creditAmounts[index]
          })
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
  const starting = +startDateFromISO <= +started && +started <= +endDateFromISO

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
    starting,
    option,
    birthdate,
    studyplans,
    sis_person_id,
    citizenships,
    criteriaProgress: toProgressCriteria(),
    curriculumVersion: getCurriculumVersion(correctStudyplan[0]?.curriculum_period_id),
    transferredStudyright,
    transferSource,
  }
}

export type QueryParams = {
  year: string
  months?: string
  semesters: string[]
  studyRights: string | string[]
  selectedStudents?: string[]
  selectedStudentsByYear?: Record<string, string[]>
  studentStatuses?: string[]
  years?: string[]
  courses?: string[]
}

export type ParsedQueryParams = {
  startDate: string
  endDate: string
  includeExchangeStudents: boolean
  includeNondegreeStudents: boolean
  includeTransferredStudents: boolean
  studyRights: string[]
  months?: string
}

export const parseQueryParams = (query: QueryParams): ParsedQueryParams => {
  const { semesters, studentStatuses, studyRights, months, year } = query
  const yearAsNumber = +year

  const hasFall = semesters.includes('FALL')
  const hasSpring = semesters.includes('SPRING')

  const startDate = hasFall
    ? new Date(`${yearAsNumber}-${SemesterStart.FALL}`).toISOString()
    : new Date(`${yearAsNumber + 1}-${SemesterStart.SPRING}`).toISOString()

  const endDate = hasSpring
    ? new Date(`${yearAsNumber + 1}-${SemesterStart.FALL}`).toISOString()
    : new Date(`${yearAsNumber + 1}-${SemesterStart.SPRING}`).toISOString()

  const includeExchangeStudents = !!studentStatuses?.includes('EXCHANGE')
  const includeNondegreeStudents = !!studentStatuses?.includes('NONDEGREE')
  const includeTransferredStudents = !!studentStatuses?.includes('TRANSFERRED')

  return {
    includeExchangeStudents,
    includeNondegreeStudents,
    includeTransferredStudents,
    // Remove falsy values so the query doesn't break
    studyRights: formatToArray(studyRights).filter(Boolean),
    months,
    startDate,
    endDate,
  }
}

export const getOptionsForStudents = async (studentNumbers: string[], code: string, level?: DegreeProgrammeType) => {
  if (!studentNumbers.length) {
    return {}
  } else if (level && ![DegreeProgrammeType.BACHELOR, DegreeProgrammeType.MASTER].includes(level)) {
    return {}
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

  return Object.fromEntries(
    studyRightElementsForStudyRight
      .map(({ studyRight }) => {
        const levelIsMasters = level === DegreeProgrammeType.MASTER
        const filter = levelIsMasters ? DegreeProgrammeType.BACHELOR : DegreeProgrammeType.MASTER

        // NOTE: If in masters, then select latest finished bachlor studyRight otherwise select first started masters studyRight
        const [latestProgramme] = orderBy(
          studyRight.studyRightElements.filter(element => element.degreeProgrammeType === filter),
          [levelIsMasters ? 'endDate' : 'startDate'],
          [levelIsMasters ? 'desc' : 'asc']
        )

        return [studyRight.studentNumber, { name: latestProgramme?.name }] as [string, { name: Name }]
      })
      .filter(([_, { name }]) => !!name)
  )
}

export const formatStudentsForApi = (
  students: Array<Student & { tags?: TagStudent[] }>,
  enrollments: Enrollment[],
  credits: Credit[],
  courses: Course[],
  startDate: string,
  endDate: string,
  optionData: Record<string, { name: Name }>,
  criteria: ProgressCriteria,
  code: string
) => {
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
        endDate,
        criteria,
        code,
        optionData
      )
    ),
    courses,
  }
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

const findDefinedCourseStatsForStudents = `
  SELECT
    course.code,
    course.name,
    course.substitutions,
    course.main_course_code,
    enrollment.data AS enrollments,
    credit.data AS credits
  FROM course
  LEFT JOIN (
    SELECT
      course_code,
      ARRAY_AGG(JSONB_BUILD_OBJECT(
        'studentnumber', studentnumber,
        'state', state,
        'enrollment_date_time', enrollment_date_time
      )) AS data
    FROM enrollment
    WHERE studentnumber IN (:studentnumbers)
      AND state = :enrollmentState
    GROUP BY course_code
  ) AS enrollment
    ON enrollment.course_code = course.code
  LEFT JOIN (
    SELECT
      course_code,
      ARRAY_AGG(JSONB_BUILD_OBJECT(
        'grade', grade,
        'student_studentnumber', student_studentnumber,
        'attainment_date', attainment_date,
        'credittypecode', credittypecode,
        'course_code', course_code
      )) AS data
    FROM credit
    WHERE student_studentnumber IN (:studentnumbers)
    GROUP BY course_code
  ) AS credit
    ON credit.course_code = course.code
  WHERE
    (
      course.code IN (:courseCodes)
      OR (
        SELECT
          JSONB_AGG(DISTINCT alt_code)
        FROM course, LATERAL JSONB_ARRAY_ELEMENTS(substitutions) as alt_code
        WHERE code IN (:courseCodes)
      ) ? course.code
    ) AND (enrollment.data IS NOT NULL OR credit.data IS NOT NULL)
`

const findAllCourseStatsForStudents = `
  SELECT
    course.code,
    course.name,
    course.substitutions,
    course.main_course_code,
    enrollment.data AS enrollments,
    credit.data AS credits
  FROM course
  LEFT JOIN (
    SELECT
      course_code,
      ARRAY_AGG(JSONB_BUILD_OBJECT(
        'studentnumber', studentnumber,
        'state', state,
        'enrollment_date_time', enrollment_date_time
      )) AS data
    FROM enrollment
    WHERE studentnumber IN (:studentnumbers)
      AND state = :enrollmentState
    GROUP BY course_code
  ) AS enrollment
    ON enrollment.course_code = course.code
  LEFT JOIN (
    SELECT
      course_code,
      ARRAY_AGG(JSONB_BUILD_OBJECT(
        'grade', grade,
        'student_studentnumber', student_studentnumber,
        'attainment_date', attainment_date,
        'credittypecode', credittypecode,
        'course_code', course_code
      )) AS data
    FROM credit
    WHERE student_studentnumber IN (:studentnumbers)
    GROUP BY course_code
  ) AS credit
    ON credit.course_code = course.code
  WHERE
    enrollment.data IS NOT NULL OR credit.data IS NOT NULL
`

export const findCourses = async (studentNumbers: string[], courses: string[] = []) => {
  return sequelize.query(courses.length ? findDefinedCourseStatsForStudents : findAllCourseStatsForStudents, {
    replacements: {
      studentnumbers: studentNumbers.length > 0 ? studentNumbers : ['DUMMY'],
      courseCodes: courses.length ? courses : ['DUMMY'],
      enrollmentState: EnrollmentState.ENROLLED,
    },
    type: QueryTypes.SELECT,
  }) as Promise<CoursesQueryResult>
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
