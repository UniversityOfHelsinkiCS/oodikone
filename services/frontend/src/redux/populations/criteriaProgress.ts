import { PopulationCourseStats } from '@oodikone/shared/routes/populations'
import { CreditTypeCode, CriteriaYear, ProgressCriteria, Unarray } from '@oodikone/shared/types'
import { StudentStudyPlan } from '@oodikone/shared/types/studentData'
import { dateYearsFromNow, dateDaysFromNow } from '@oodikone/shared/util/datetime'
import { PopulationCourseStatsCredit } from './util'

const yearMap: [string, keyof ProgressCriteria['courses']][] = [
  ['year1', 'yearOne'],
  ['year2', 'yearTwo'],
  ['year3', 'yearThree'],
  ['year4', 'yearFour'],
  ['year5', 'yearFive'],
  ['year6', 'yearSix'],
]

const getCriteriaBase = (criteria: ProgressCriteria): [boolean, Record<string, CriteriaYear>] => {
  const thereAreCriteriaCourses = !!Object.values(criteria.courses).flatMap(val => val).length
  const thereAreCriteriaCredits = !!Object.values(criteria.credits).reduce((acc, cur) => acc + cur, 0)

  const createEmptyCriteriaYear = (criteria: ProgressCriteria, year: keyof ProgressCriteria['courses']) => ({
    credits: false,
    totalSatisfied: 0,
    coursesSatisfied: Object.fromEntries(criteria.courses[year].map(course => [course, null])),
  })

  const criteriaChecked: Record<string, CriteriaYear> = {
    year1: createEmptyCriteriaYear(criteria, 'yearOne'),
    year2: createEmptyCriteriaYear(criteria, 'yearTwo'),
    year3: createEmptyCriteriaYear(criteria, 'yearThree'),
    year4: createEmptyCriteriaYear(criteria, 'yearFour'),
    year5: createEmptyCriteriaYear(criteria, 'yearFive'),
    year6: createEmptyCriteriaYear(criteria, 'yearSix'),
  }

  return [thereAreCriteriaCourses || thereAreCriteriaCredits, criteriaChecked]
}

const getCreditsSubstitutionGroupCompletionDate = (credits: { course_code: string, credits: number, credittypecode: CreditTypeCode, date: Date | string }[], substitutionGroup: string[]): Date | null => {
  if (!substitutionGroup.every(code => (credits?.map(({ course_code }) => course_code)).includes(code))) {
    return null
  }

  /** Sort by attainmentDate in descending order eg. latest first */
  // TODO: Same flawed logic as previous substitution group completion date calculations
  const sortByDate = (a: Unarray<typeof credits>, b: Unarray<typeof credits>) => {
    if (a.date < b.date) return 1
    if (a.date > b.date) return -1
    if (a.date === b.date) return 0
    else return NaN
  }

  const latestCredit = substitutionGroup
    // Existence checked above
    .map(code => credits.find(credit => credit.course_code === code)!)
    .sort(sortByDate).at(0)!.date

  return typeof latestCredit === "string" ? new Date(latestCredit) : latestCredit
}

export const getProgressCriteria = (
  criteria: ProgressCriteria,
  studyRightStartDate: string,
  hops: StudentStudyPlan | undefined,
  credits: PopulationCourseStatsCredit[], // AnonymousCredit[],
) => {
  const [thereAreCriteria, criteriaChecked] = getCriteriaBase(criteria)
  if (!thereAreCriteria) return criteriaChecked
  const passedCreditTypeCodes = [CreditTypeCode.PASSED, CreditTypeCode.APPROVED, CreditTypeCode.IMPROVED]
  const studyRightStartDateFromISO = new Date(studyRightStartDate)

  /** Number of credits completed during each academic year */
  const academicYears = { year1: 0, year2: 0, year3: 0, year4: 0, year5: 0, year6: 0 }

  /** Credits produced by a student */
  const courses = credits.map(({ attainment_date, course_code, credits, credittypecode }) => ({
    course_code,
    credits,
    credittypecode,
    date: attainment_date < studyRightStartDateFromISO ? dateDaysFromNow(studyRightStartDateFromISO, 1).toISOString() : attainment_date,
  }))

  Object.entries(criteria.allCourseGroups).map(([mainCourseCode, substitutionGroups]) => {
    const mainCourse = courses.find(course => course.course_code === mainCourseCode && passedCreditTypeCodes.includes(course.credittypecode))
    yearMap.forEach(([yearToAdd, criteriaYear]) => {
      if (criteria.courses[criteriaYear].includes(mainCourseCode)) {
        const currentDate = criteriaChecked[yearToAdd].coursesSatisfied[mainCourseCode]

        // Credit found, course was passed normally
        if (mainCourse) {
          const courseDate = new Date(mainCourse.date)
          // Add date to courses that have been passed
          if (!currentDate || courseDate < new Date(currentDate)) {
            criteriaChecked[yearToAdd].coursesSatisfied[mainCourseCode] = mainCourse.date.toLocaleString()
          }

          // Add credits to academicYears
          if (studyRightStartDateFromISO < courseDate && !!hops && hops.included_courses.includes(mainCourseCode)) {
            Object.keys(academicYears)
              .filter((_, index) => courseDate < dateYearsFromNow(studyRightStartDateFromISO, index + 1))
              .forEach(year => (academicYears[year] += mainCourse.credits))
          }

        } else {
          // Credit for mainCourseCode not found, checking substitution_groups
          const passedCourseCodes = courses.filter(course => passedCreditTypeCodes.includes(course.credittypecode)).map(({ course_code }) => course_code)
          for (const group of substitutionGroups) {
            // Add date to the course that has a completed substitution group
            if (group.every(code => passedCourseCodes.includes(code))) {
              criteriaChecked[yearToAdd].coursesSatisfied[mainCourseCode] = "substituted"
              // courses
              // .filter(course => group.includes(course.course_code))
              // // Get the latest attainment of the group => when the group was completed
              // // TODO: Problem: What if the group was completed in 1995, but one course was improved in 2022?
              // .sort((a, b) => b.date - a.date).at(0)?.date! // We know that this course exists
            }

            // Add all credits cumulatively to each academicYear e.g. credits produced in 2019 will be added to 2020 credits
            if (group.every(code => (studyRightStartDateFromISO < new Date(courses.find(course => course.course_code === code)?.date ?? 0) && !!hops && hops.included_courses.includes(code)))) {
              const latestCourseDate = getCreditsSubstitutionGroupCompletionDate(group.map(code => courses.find(course => course.course_code === code)!), group)!
              Object.keys(academicYears)
                .filter((_, index) => latestCourseDate < dateYearsFromNow(studyRightStartDateFromISO, index + 1))
                .forEach(year => (
                  academicYears[year] += group.reduce((acc, code) => acc + courses.find(course => course.course_code === code)?.credits))
                )
            }
          }
        }
      }
    })
  })

  yearMap.forEach(([yearToAdd, criteriaYear]) => {
    criteriaChecked[yearToAdd].totalSatisfied +=
      Object.values(criteriaChecked[yearToAdd].coursesSatisfied).filter(course => !!course).length ?? 0
    // UPDATE CREDIT CRITERIA
    if (!!criteria.credits[criteriaYear] && criteria.credits[criteriaYear] < academicYears[yearToAdd]) {
      criteriaChecked[yearToAdd].credits = true
      criteriaChecked[yearToAdd].totalSatisfied += 1
    }
  })

  return criteriaChecked
}
