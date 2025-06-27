import { SISStudyRight } from '@oodikone/shared/models'
import { Name, ProgressCriteria } from '@oodikone/shared/types'
import { dateYearsFromNow, dateDaysFromNow } from '@oodikone/shared/util/datetime'
import { CreditModel } from '../../models'
import { hasTransferredFromOrToProgramme } from '../studyProgramme/studyProgrammeHelpers'
import type { TaggetStudentData } from './getStudentData'
import type { AnonymousCredit } from './optimizedStatisticsOf'
import { getCurriculumVersion } from './shared'

type CoursesSatisfied = Record<string, string | null>

type CriteriaYear = {
  credits: boolean
  totalSatisfied: number
  coursesSatisfied: CoursesSatisfied
}

const yearMap: [string, keyof ProgressCriteria['courses']][] = [
  ['year1', 'yearOne'],
  ['year2', 'yearTwo'],
  ['year3', 'yearThree'],
  ['year4', 'yearFour'],
  ['year5', 'yearFive'],
  ['year6', 'yearSix'],
]

export const formatStudentForAPI = (
  code: string,
  startDate: string,
  student: TaggetStudentData,
  credits: AnonymousCredit[],
  optionData: Name | undefined,
  criteria: ProgressCriteria
) => {
  const { studentnumber, studyRights, studyplans } = student
  const startDateFromISO = new Date(startDate)

  const criteriaCoursesBySubstitutions: Record<string, string> = Object.fromEntries(
    Object.entries(criteria.allCourses).flatMap(([courseCode, substitutionCodes]) => [
      [courseCode, courseCode],
      ...substitutionCodes.map(code => [code, courseCode]),
    ])
  )

  const hops = studyplans.filter(plan => plan.programme_code === code)

  let transferredStudyright = false
  let transferSource: string | null = null

  if (code) {
    const correctStudyRight = studyRights.find(studyRight =>
      studyRight.studyRightElements.some(element => element.code === code)
    )
    const correctStudyRightElement = correctStudyRight?.studyRightElements.find(element => element.code === code)
    if (correctStudyRight && correctStudyRightElement) {
      const [, hasTransferredToProgramme] = hasTransferredFromOrToProgramme(
        correctStudyRight as SISStudyRight,
        correctStudyRightElement
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

    if (thereAreCriteriaCourses || thereAreCriteriaCredits) {
      const academicYears = { year1: 0, year2: 0, year3: 0, year4: 0, year5: 0, year6: 0 }

      credits
        .filter(
          credit =>
            CreditModel.passed({ credittypecode: credit.credittypecode }) ||
            CreditModel.improved({ credittypecode: credit.credittypecode })
        )
        .map(credit => ({
          course_code: credit.course_code,
          credits: credit.credits,
          date:
            credit.attainment_date < startDateFromISO
              ? dateDaysFromNow(startDateFromISO, 1).toISOString()
              : credit.attainment_date.toISOString(),
        }))
        .filter(course => !!criteriaCoursesBySubstitutions[course.course_code])
        .forEach(course => {
          const courseDate = new Date(course.date)
          const correctCode = criteriaCoursesBySubstitutions[course.course_code]

          if (
            hops.length &&
            startDateFromISO < courseDate &&
            (hops[0].included_courses.includes(course.course_code) || hops[0].included_courses.includes(correctCode))
          )
            Object.keys(academicYears)
              .filter((_, index) => courseDate < dateYearsFromNow(startDateFromISO, index + 1))
              .forEach(year => (academicYears[year] += course.credits))

          yearMap.forEach(([yearToAdd, criteriaYear]) => {
            const mainCourseCodes = criteria.courses[criteriaYear]

            // Each mainCode will have their substitutions fetched.
            // Therefore theses will always be valid keys to the allCourses -object.
            const substitutions = mainCourseCodes.flatMap(mainCode => criteria.allCourses[mainCode])

            const yearSet = new Set([...mainCourseCodes, ...substitutions])

            if (yearSet?.has(course.course_code)) {
              const currentDate = criteriaChecked[yearToAdd].coursesSatisfied[correctCode]
              if (!currentDate || new Date(course.date) < new Date(currentDate)) {
                criteriaChecked[yearToAdd].coursesSatisfied[correctCode] = course.date
              }
            }
          })
        })

      yearMap.forEach(([yearToAdd, criteriaYear]) => {
        // UPDATE CREDIT CRITERIA
        criteriaChecked[yearToAdd].totalSatisfied +=
          Object.values(criteriaChecked[yearToAdd].coursesSatisfied).filter(course => !!course).length ?? 0

        if (!!criteria?.credits[criteriaYear] && academicYears[yearToAdd] >= criteria?.credits[criteriaYear]) {
          criteriaChecked[yearToAdd].credits = true
          criteriaChecked[yearToAdd].totalSatisfied += 1
        }
      })
    }

    return criteriaChecked
  }

  const {
    firstnames,
    lastname,
    dateofuniversityenrollment,
    creditcount,
    abbreviatedname,
    gender_code,
    email,
    secondary_email,
    phone_number,
    updatedAt,
    tags,
    birthdate,
    sis_person_id,
    citizenships,
  } = student

  return {
    firstnames,
    lastname,
    studyRights,
    started: dateofuniversityenrollment,
    studentNumber: studentnumber,
    credits: creditcount ?? 0,
    courses: credits.map(credit => {
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
    }),
    name: abbreviatedname,
    gender_code,
    email,
    secondaryEmail: secondary_email,
    phoneNumber: phone_number,
    updatedAt,
    tags,
    studyrightStart: startDate,
    option: optionData ? { name: optionData } : null,
    birthdate,
    studyplans,
    sis_person_id,
    citizenships,
    criteriaProgress: toProgressCriteria(),
    curriculumVersion: getCurriculumVersion(hops[0]?.curriculum_period_id),
    transferredStudyright,
    transferSource,
  }
}
