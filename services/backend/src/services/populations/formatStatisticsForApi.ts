import { Credit, SISStudyRight, SISStudyRightElement } from '../../models'
import { Name, ProgressCriteria } from '../../shared/types'
import { ParsedCourse } from '../../types'
import { dateYearsFromNow, dateDaysFromNow } from '../../util/datetime'
import { hasTransferredFromOrToProgramme } from '../studyProgramme/studyProgrammeHelpers'
import type {
  TaggetStudentData,
  StudentStudyPlan,
  StudentCourse,
  StudentEnrollment,
  StudentCredit,
} from './getStudentsIncludeCoursesBetween'
import { getCurriculumVersion } from './shared'

type CoursesSatisfied = Record<string, string | null>

type CriteriaYear = {
  credits: boolean
  totalSatisfied: number
  coursesSatisfied: CoursesSatisfied
}

const createEmptyCriteriaYear = (
  criteria: ProgressCriteria,
  year: keyof ProgressCriteria['courses']
): CriteriaYear => ({
  credits: false,
  totalSatisfied: 0,
  coursesSatisfied: Object.fromEntries(criteria.courses[year].map(course => [course, null])),
})

const getCreditAmount = (course: ParsedCourse, hops: StudentStudyPlan[], courseCode: string, startDate: string) => {
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
      Object.values(criteriaChecked?.[yearToAdd].coursesSatisfied).filter(course => course !== null).length || 0
  }
  if (academicYears[academicYear] >= criteria?.credits[criteriaYear] && criteria?.credits[criteriaYear] > 0) {
    criteriaChecked[yearToAdd].credits = true
    criteriaChecked[yearToAdd].totalSatisfied += 1
  }
}

export const formatStudentsForApi = (
  students: Array<TaggetStudentData>,
  enrollments: StudentEnrollment[],
  credits: StudentCredit[],
  courses: StudentCourse[],
  startDate: string,
  endDate: string,
  optionData: Record<string, { name: Name }>,
  criteria: ProgressCriteria,
  code: string
) => {
  const creditsByStudent = credits.reduce((acc: Record<string, StudentCredit[]>, credit) => {
    const { student_studentnumber: studentnumber } = credit
    acc[studentnumber] = [...(acc[studentnumber] || []), credit]
    return acc
  }, {})
  const enrollmentsByStudent = enrollments.reduce((acc: Record<string, StudentEnrollment[]>, enrollment) => {
    const { studentnumber } = enrollment
    acc[studentnumber] = [...(acc[studentnumber] || []), enrollment]
    return acc
  }, {})

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

const formatStudentForPopulationStatistics = (
  student: TaggetStudentData,
  enrollments: Record<string, StudentEnrollment[]>,
  credits: Record<string, StudentCredit[]>,
  startDate: string,
  endDate: string,
  criteria: ProgressCriteria,
  code: string,
  optionData: Record<string, { name: Name }>
) => {
  const startDateFromISO = new Date(startDate)
  const endDateFromISO = new Date(endDate)

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
    gender_code,
    tags,
    birthdate,
    sis_person_id,
    citizenships,
  } = student

  const started = dateofuniversityenrollment
  const starting = +startDateFromISO <= +started && +started <= +endDateFromISO

  const criteriaCoursesBySubstitutions: Record<string, string> = Object.fromEntries(
    Object.entries(criteria.allCourses).flatMap(([courseCode, substitutionCodes]) => [
      [courseCode, courseCode],
      ...substitutionCodes.map(code => [code, courseCode]),
    ])
  )

  const correctStudyplan = studyplans.filter(plan => plan.programme_code === code)

  const option = studentnumber in optionData ? optionData[studentnumber] : null

  let transferredStudyright = false
  let transferSource: string | null = null

  if (code) {
    const correctStudyRight = studyRights.find(studyRight =>
      studyRight.studyRightElements.some(element => element.code === code)
    )
    if (correctStudyRight) {
      // NOTE: This must never be undefined
      const correctStudyRightElement = correctStudyRight.studyRightElements.find(element => element.code === code)
      const [, hasTransferredToProgramme] = hasTransferredFromOrToProgramme(
        correctStudyRight as SISStudyRight,
        correctStudyRightElement as SISStudyRightElement
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

  const parseCourse = (credit: StudentCredit, normalizeDate: boolean): ParsedCourse => {
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
      const courses = credits[studentnumber] ? credits[studentnumber].map(credit => parseCourse(credit, true)) : []

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

  return {
    firstnames,
    lastname,
    studyRights,
    started,
    studentNumber: studentnumber,
    credits: creditcount || 0,
    courses: credits[studentnumber]?.map(credit => parseCourse(credit, false)) ?? [],
    enrollments: enrollments[studentnumber],
    name: abbreviatedname,
    gender_code,
    email,
    secondaryEmail: secondary_email,
    phoneNumber: phone_number,
    updatedAt,
    tags,
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
