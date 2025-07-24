import { SISStudyRight } from '@oodikone/shared/models'
import { FormattedStudent, CriteriaYear, Name, ProgressCriteria } from '@oodikone/shared/types'
import { dateYearsFromNow, dateDaysFromNow, dayInMilliseconds } from '@oodikone/shared/util/datetime'
import { CreditModel } from '../../models'
import { hasTransferredFromOrToProgramme } from '../studyProgramme/studyProgrammeHelpers'
import type { StudentStudyPlan, StudentStudyRight, TaggetStudentData } from './getStudentData'
import { getCurriculumVersion } from './shared'
import type { AnonymousCredit } from './statisticsOf'

const yearMap: [string, keyof ProgressCriteria['courses']][] = [
  ['year1', 'yearOne'],
  ['year2', 'yearTwo'],
  ['year3', 'yearThree'],
  ['year4', 'yearFour'],
  ['year5', 'yearFive'],
  ['year6', 'yearSix'],
]

const getTransferSource = (code: string, studyRights: StudentStudyRight[]): [boolean, string | undefined] => {
  if (code) {
    const correctStudyRight = studyRights.find(({ studyRightElements }) =>
      studyRightElements.some(element => element.code === code)
    )!
    const correctStudyRightElement = correctStudyRight.studyRightElements.find(element => element.code === code)

    if (correctStudyRight && correctStudyRightElement) {
      const studyRightStart = new Date(correctStudyRightElement?.startDate ?? 0)
      const studyRightStartDate = dateDaysFromNow(studyRightStart, -1)

      const [, hasTransferredToProgramme] = hasTransferredFromOrToProgramme(
        correctStudyRight as SISStudyRight,
        correctStudyRightElement
      )

      if (hasTransferredToProgramme) {
        const transferredFromProgramme = correctStudyRight.studyRightElements.find(element => {
          const otherStudyRightEndDate = new Date(element.endDate)

          return studyRightStartDate.getTime() - otherStudyRightEndDate.getTime() < dayInMilliseconds
        })?.code

        return [true, transferredFromProgramme]
      }
    }
  }

  return [false, undefined]
}

const getCriteriaBase = (criteria: ProgressCriteria): [boolean, { [year: string]: CriteriaYear }] => {
  const thereAreCriteriaCourses = !!Object.values(criteria.courses).flatMap(val => val).length
  const thereAreCriteriaCredits = !!Object.values(criteria.credits).reduce((acc, cur) => acc + cur, 0)

  const createEmptyCriteriaYear = (criteria: ProgressCriteria, year: keyof ProgressCriteria['courses']) => ({
    credits: false,
    totalSatisfied: 0,
    coursesSatisfied: Object.fromEntries(criteria.courses[year].map(course => [course, null])),
  })

  const criteriaChecked: { [year: string]: CriteriaYear } = {
    year1: createEmptyCriteriaYear(criteria, 'yearOne'),
    year2: createEmptyCriteriaYear(criteria, 'yearTwo'),
    year3: createEmptyCriteriaYear(criteria, 'yearThree'),
    year4: createEmptyCriteriaYear(criteria, 'yearFour'),
    year5: createEmptyCriteriaYear(criteria, 'yearFive'),
    year6: createEmptyCriteriaYear(criteria, 'yearSix'),
  }

  return [thereAreCriteriaCourses || thereAreCriteriaCredits, criteriaChecked]
}

const getProgressCriteria = (
  startDate: string,
  criteria: ProgressCriteria,
  credits: AnonymousCredit[],
  hops: StudentStudyPlan | undefined
) => {
  const startDateFromISO = new Date(startDate)

  const criteriaCoursesBySubstitutions: Record<string, string> = Object.fromEntries(
    Object.entries(criteria.allCourses).flatMap(([courseCode, substitutionCodes]) => [
      [courseCode, courseCode],
      ...substitutionCodes.map(code => [code, courseCode]),
    ])
  )

  const [thereAreCriteria, criteriaChecked] = getCriteriaBase(criteria)
  if (!thereAreCriteria) return criteriaChecked

  const academicYears = { year1: 0, year2: 0, year3: 0, year4: 0, year5: 0, year6: 0 }

  const courses = credits.map(({ attainment_date, course_code, credits, credittypecode }) => ({
    course_code,
    credits,
    credittypecode,
    date:
      attainment_date < startDateFromISO
        ? dateDaysFromNow(startDateFromISO, 1).toISOString()
        : attainment_date.toISOString(),
  }))

  courses
    .filter(({ course_code }) => !!criteriaCoursesBySubstitutions[course_code])
    .filter(({ credittypecode }) => CreditModel.passed({ credittypecode }) || CreditModel.improved({ credittypecode }))
    .forEach(course => {
      const courseDate = new Date(course.date)
      const correctCode = criteriaCoursesBySubstitutions[course.course_code]

      yearMap.forEach(([yearToAdd, criteriaYear]) => {
        if (criteria.courses[criteriaYear].includes(correctCode)) {
          const currentDate = criteriaChecked[yearToAdd].coursesSatisfied[correctCode]
          if (!currentDate || courseDate < new Date(currentDate)) {
            criteriaChecked[yearToAdd].coursesSatisfied[correctCode] = course.date
          }
        }
      })
    })

  courses.forEach(course => {
    const courseDate = new Date(course.date)
    const correctCode = criteriaCoursesBySubstitutions[course.course_code]

    if (
      startDateFromISO < courseDate &&
      !!hops &&
      (hops.included_courses.includes(course.course_code) || hops.included_courses.includes(correctCode))
    )
      Object.keys(academicYears)
        .filter((_, index) => courseDate < dateYearsFromNow(startDateFromISO, index + 1))
        .forEach(year => (academicYears[year] += course.credits))
  })

  yearMap.forEach(([yearToAdd, criteriaYear]) => {
    // UPDATE CREDIT CRITERIA
    if (!!criteria.credits[criteriaYear] && criteria.credits[criteriaYear] < academicYears[yearToAdd]) {
      criteriaChecked[yearToAdd].credits = true
    }
  })

  return criteriaChecked
}

export const formatStudentForAPI = (
  code: string,
  startDate: string,
  student: TaggetStudentData,
  credits: AnonymousCredit[],
  optionData: Name | undefined,
  criteria: ProgressCriteria
): FormattedStudent => {
  const { studentnumber, studyRights, studyplans } = student

  const hops = studyplans.find(plan => plan.programme_code === code)
  const [transferredStudyright, transferSource] = getTransferSource(code, studyRights)

  const courses = credits.map(credit => {
    const attainmentDateNormalized = credit.attainment_date.toISOString()
    const passed =
      CreditModel.passed({ credittypecode: credit.credittypecode }) ||
      CreditModel.improved({ credittypecode: credit.credittypecode })

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
  })

  return {
    firstnames: student.firstnames,
    lastname: student.lastname,
    started: student.dateofuniversityenrollment,
    studentNumber: studentnumber,
    credits: student.creditcount ?? 0,

    hopsCredits: hops?.completed_credits ?? 0,
    name: student.abbreviatedname,
    gender_code: student.gender_code,
    email: student.email,
    secondaryEmail: student.secondary_email,
    phoneNumber: student.phone_number,
    updatedAt: student.updatedAt,
    tags: student.tags,
    studyrightStart: startDate,
    option: optionData ? { name: optionData } : null,
    birthdate: student.birthdate,
    sis_person_id: student.sis_person_id,
    citizenships: student.citizenships,
    criteriaProgress: getProgressCriteria(startDate, criteria, credits, hops),
    curriculumVersion: getCurriculumVersion(hops?.curriculum_period_id),

    transferredStudyright,
    transferSource,
    studyRights,
    studyplans,
    courses,
  }
}
