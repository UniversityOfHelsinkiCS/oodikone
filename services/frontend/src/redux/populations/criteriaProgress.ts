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
  idToGroupId: Record<string, string>
) => {
  const [thereAreCriteria, criteriaChecked] = getCriteriaBase(criteria)
  if (!thereAreCriteria) return criteriaChecked
  const passedCreditTypeCodes = [CreditTypeCode.PASSED, CreditTypeCode.APPROVED]
  const studyRightStartDateFromISO = new Date(studyRightStartDate)

  /** Number of credits completed during each academic year */
  const academicYears = { year1: 0, year2: 0, year3: 0, year4: 0, year5: 0, year6: 0 }

  /** Credits produced by a student, resolved from their (possibly historical) course_id to the course's group id */
  const courses = credits
    .map(({ attainment_date, course_id, credits, credittypecode }) => ({
      group_id: idToGroupId[course_id],
      credits,
      credittypecode,
      date: attainment_date,
    }))
    .filter((course): course is typeof course & { group_id: string } => !!course.group_id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  Object.entries(criteria.allCourseGroups).map(([mainGroupId, substitutionGroups]) => {
    const mainCourse = courses.find(
      course => course.group_id === mainGroupId && passedCreditTypeCodes.includes(course.credittypecode)
    )
    yearMap.forEach(([yearToAdd, criteriaYear]) => {
      if (criteria.courses[criteriaYear].includes(mainGroupId)) {
        const currentDate = criteriaChecked[yearToAdd].coursesSatisfied[mainGroupId]

        // Credit found, course was passed normally
        if (mainCourse) {
          const courseDate = new Date(mainCourse.date)
          // Add date to courses that have been passed
          if (!currentDate || courseDate < new Date(currentDate)) {
            criteriaChecked[yearToAdd].coursesSatisfied[mainGroupId] = mainCourse.date.toLocaleString()
          }
        } else {
          // Credit for mainGroupId not found, checking substitution groups
          const passedGroupIds = courses
            .filter(course => passedCreditTypeCodes.includes(course.credittypecode))
            .map(({ group_id }) => group_id)
          for (const group of substitutionGroups) {
            // Add date to the course that has a completed substitution group
            if (group.every(groupId => passedGroupIds.includes(groupId))) {
              criteriaChecked[yearToAdd].coursesSatisfied[mainGroupId] = 'substituted'
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

    const mainGroupIds = Object.keys(criteria.allCourseGroups).filter(mainGroupId => {
      if (mainGroupId === course.group_id) return true
      return criteria.allCourseGroups[mainGroupId].some(group => group.includes(course.group_id))
    })

    // included_courses holds course ids, resolved to group ids
    const hopsGroupIds = hops.included_courses.map(id => idToGroupId[id]).filter(Boolean)
    const isInStudyPlan =
      hopsGroupIds.includes(course.group_id) || mainGroupIds.some(groupId => hopsGroupIds.includes(groupId))
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
