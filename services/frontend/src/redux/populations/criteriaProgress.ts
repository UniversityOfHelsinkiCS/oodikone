import { CreditTypeCode, CriteriaYear, ProgressCriteria } from '@oodikone/shared/types'
import { StudentStudyPlan } from '@oodikone/shared/types/studentData'
import { dateYearsFromNow } from '@oodikone/shared/util/datetime'
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

export const getProgressCriteria = (
  criteria: ProgressCriteria,
  studyRightStartDate: string,
  hops: StudentStudyPlan | undefined,
  credits: PopulationCourseStatsCredit[],
  idToCode: Record<string, string>,
  groupIdToCode: Record<string, string>
) => {
  const [thereAreCriteria, criteriaChecked] = getCriteriaBase(criteria)
  if (!thereAreCriteria) return criteriaChecked
  const passedCreditTypeCodes = [CreditTypeCode.PASSED, CreditTypeCode.APPROVED]
  const studyRightStartDateFromISO = new Date(studyRightStartDate)

  /** Number of credits completed during each academic year */
  const academicYears = { year1: 0, year2: 0, year3: 0, year4: 0, year5: 0, year6: 0 }

  /** Credits produced by a student, resolved from their (possibly historical) course_id to the course's current code */
  const courses = credits
    .map(({ attainment_date, course_id, credits, credittypecode }) => ({
      course_code: idToCode[course_id],
      credits,
      credittypecode,
      date: attainment_date,
    }))
    .filter((course): course is typeof course & { course_code: string } => !!course.course_code)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  Object.entries(criteria.allCourseGroups).map(([mainCourseCode, substitutionGroups]) => {
    const mainCourse = courses.find(
      course => course.course_code === mainCourseCode && passedCreditTypeCodes.includes(course.credittypecode)
    )
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
        } else {
          // Credit for mainCourseCode not found, checking substitution groups (each entry is a groupId, not a code)
          const passedCourseCodes = courses
            .filter(course => passedCreditTypeCodes.includes(course.credittypecode))
            .map(({ course_code }) => course_code)
          for (const group of substitutionGroups) {
            // Add date to the course that has a completed substitution group
            if (group.every(groupId => passedCourseCodes.includes(groupIdToCode[groupId]))) {
              criteriaChecked[yearToAdd].coursesSatisfied[mainCourseCode] = 'substituted'
            }
          }
        }
      }
    })
  })

  // Count all passed credits from the student's study plan towards each academic year's credit criterion
  courses.forEach(course => {
    if (!passedCreditTypeCodes.includes(course.credittypecode) || !hops) return
    const courseDate = new Date(course.date)
    if (!(studyRightStartDateFromISO < courseDate)) return

    const mainCourseCodes = Object.keys(criteria.allCourseGroups).filter(mainCourseCode => {
      if (mainCourseCode === course.course_code) return true
      return criteria.allCourseGroups[mainCourseCode].some(group =>
        group.some(groupId => groupIdToCode[groupId] === course.course_code)
      )
    })

    // included_courses holds course ids, with a rare fallback to a raw code for "custom" entries
    const hopsCodes = hops.included_courses.map(idOrCode => idToCode[idOrCode] ?? idOrCode)
    const isInStudyPlan =
      hopsCodes.includes(course.course_code) || mainCourseCodes.some(code => hopsCodes.includes(code))
    if (!isInStudyPlan) return

    Object.keys(academicYears)
      .filter((_, index) => courseDate < dateYearsFromNow(studyRightStartDateFromISO, index + 1))
      .forEach(year => (academicYears[year] += course.credits))
  })

  yearMap.forEach(([yearToAdd, criteriaYear]) => {
    criteriaChecked[yearToAdd].totalSatisfied +=
      Object.values(criteriaChecked[yearToAdd].coursesSatisfied).filter(course => !!course).length ?? 0
    // UPDATE CREDIT CRITERIA
    if (!!criteria.credits[criteriaYear] && criteria.credits[criteriaYear] <= academicYears[yearToAdd]) {
      criteriaChecked[yearToAdd].credits = true
      criteriaChecked[yearToAdd].totalSatisfied += 1
    }
  })

  return criteriaChecked
}
