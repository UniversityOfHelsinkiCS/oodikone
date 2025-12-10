import { CreditTypeCode, CriteriaYear, ProgressCriteria } from '@oodikone/shared/types'
import { dateYearsFromNow, dateDaysFromNow } from '@oodikone/shared/util/datetime'

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

export const getProgressCriteria = (
  startDate: string,
  criteria: ProgressCriteria,
  credits: any, // AnonymousCredit[],
  hops: any // StudentStudyPlan | undefined,
) => {
  const [thereAreCriteria, criteriaChecked] = getCriteriaBase(criteria)
  if (!thereAreCriteria) return criteriaChecked

  const startDateFromISO = new Date(startDate)

  const criteriaCoursesBySubstitutionMap = new Map<string, string>()
  for (const [courseCode, substitutionCodes] of Object.entries(criteria.allCourses)) {
    criteriaCoursesBySubstitutionMap.set(courseCode, courseCode)

    for (const substitutionCode of substitutionCodes) {
      criteriaCoursesBySubstitutionMap.set(substitutionCode, courseCode)
    }
  }

  const academicYears = { year1: 0, year2: 0, year3: 0, year4: 0, year5: 0, year6: 0 }

  const courses = credits.map(({ attainment_date, course_code, credits, credittypecode }) => ({
    course_code,
    credits,
    credittypecode,
    date: attainment_date < startDateFromISO ? dateDaysFromNow(startDateFromISO, 1).toISOString() : attainment_date,
  }))

  courses
    .filter(({ course_code }) => !!criteriaCoursesBySubstitutionMap.get(course_code))
    .filter(({ credittypecode }) =>
      [CreditTypeCode.PASSED, CreditTypeCode.APPROVED, CreditTypeCode.IMPROVED].includes(credittypecode)
    )
    .forEach(course => {
      const courseDate = new Date(course.date)
      const correctCode = criteriaCoursesBySubstitutionMap.get(course.course_code)!

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
    const correctCode = criteriaCoursesBySubstitutionMap.get(course.course_code)!

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
