import dayjs, { extend as dayjsExtend } from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'

import { DateFormat } from '@/constants/date'
import { isMedicalProgramme } from '@/util/studyProgramme'
import { formatDate } from '@/util/timeAndDate'
import { CreditTypeCode, EnrollmentState, FormattedStudent, ProgressCriteria } from '@oodikone/shared/types'
import { StudentCourse } from '@oodikone/shared/types/studentData'

dayjsExtend(isBetween)
dayjsExtend(isSameOrBefore)
dayjsExtend(isSameOrAfter)

export type IdToGroupId = Record<string, string>

export type Label = {
  /** Course code for course labels, otherwise a special value ('Credits', 'Criteria', 'Enrollment') */
  code: string
  /** Set for course labels */
  groupId?: string
  name: string
}

/**
  Return the attainments of the course and of each of its substitution groups, newest first. One entry per group;
  a group is only included if the student has attainments for all of its courses.
*/
export const getCourseGroups = (
  courseGroupId: string,
  criteria: ProgressCriteria | undefined,
  student: FormattedStudent,
  idToGroupId: IdToGroupId
): StudentCourse[][] => {
  const studentGroupIds = new Set(student.courses.map(({ course_id }) => idToGroupId[course_id]))

  return [[courseGroupId]]
    .concat(criteria?.allCourseGroups[courseGroupId] ?? [])
    .filter(group => group.every(groupId => studentGroupIds.has(groupId)))
    .map(group =>
      student.courses
        .filter(course => group.includes(idToGroupId[course.course_id]))
        .toSorted((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    )
}

/**
  Filter out failed courses that don't "break" a given group eg. remove the only instance of a course code

  NOTE: Does not automatically remove all failed courses!
*/
const filterFailed = (group: StudentCourse[]) => (course: StudentCourse) =>
  course.passed || !group.find(otherCourse => course.course_code === otherCourse.course_code && otherCourse.passed)

const isGroupPassed = (group: StudentCourse[]) => {
  const passedCredits = group.filter(filterFailed(group))
  return passedCredits.length > 0 && passedCredits.every(credit => credit.passed)
}

export const hasCreditTransfer = (courseGroups: StudentCourse[][]) =>
  courseGroups.some(
    group => isGroupPassed(group) && group.some(course => course.credittypecode === CreditTypeCode.APPROVED)
  )

/** Check if any courseGroup has
  1. all courses passed
  2. *LATEST* attainment gotten during the wanted academic year
  3. All attainments gotten before the wanted academic year's end
  */
export const hasPassedDuringAcademicYear = (courseGroups: StudentCourse[][], start: dayjs.Dayjs, end: dayjs.Dayjs) =>
  courseGroups.some(group => {
    if (!isGroupPassed(group)) return false
    const passedCredits = group.filter(credit => credit.passed)
    return (
      passedCredits.some(credit => dayjs(credit.date).isBetween(start, end)) &&
      passedCredits.every(credit => dayjs(credit.date).isBefore(end))
    )
  })

/** Check if any group has only passed courses */
export const hasPassedOutsideAcademicYear = (courseGroups: StudentCourse[][]) => courseGroups.some(isGroupPassed)

/**
  Check if there is a failed course that was not removed by the filterFailed eg. there is
  a failed course that has no passed attainment
*/
export const hasFailed = (courseGroups: StudentCourse[][]) =>
  courseGroups.some(group => group.filter(filterFailed(group)).some(course => !course.passed))

/** Return enrollments only for main courses */
export const getEnrollments = (student: FormattedStudent, courseGroupId: string, idToGroupId: IdToGroupId) =>
  (student.enrollments ?? []).filter(
    enrollment => enrollment.state === EnrollmentState.ENROLLED && idToGroupId[enrollment.course_id] === courseGroupId
  )

export const hasEnrolled = (student: FormattedStudent, courseGroupId: string, idToGroupId: IdToGroupId) =>
  getEnrollments(student, courseGroupId, idToGroupId).length > 0

/** Text representation of a cell, used for the tooltip and the Excel export */
export const getCellText = (
  label: Label,
  criteria: ProgressCriteria | undefined,
  student: FormattedStudent,
  year: string,
  idToGroupId: IdToGroupId
) => {
  if (label.code === 'Credits') {
    return student.criteriaProgress[year]?.credits ? 'Passed' : ''
  }
  if (!label.groupId) return ''

  const courseGroups = getCourseGroups(label.groupId, criteria, student, idToGroupId)

  const passedGroup = courseGroups.find(isGroupPassed)
  if (passedGroup) {
    const isMainCourse = passedGroup.every(course => idToGroupId[course.course_id] === label.groupId)
    const latestPassed = passedGroup.find(course => course.passed)
    return `Passed ${isMainCourse ? formatDate(latestPassed?.date, DateFormat.ISO_DATE) : '(substituted)'}`
  }

  if (hasFailed(courseGroups)) {
    const latestFailedCourse = courseGroups
      .flatMap(group => group.filter(filterFailed(group)))
      .find(course => !course.passed)
    return `Failed ${latestFailedCourse ? formatDate(latestFailedCourse.date, DateFormat.ISO_DATE) : '(substituted)'}`
  }

  const [enrollment] = getEnrollments(student, label.groupId, idToGroupId)
  if (enrollment) {
    return `Enrollment ${formatDate(enrollment.enrollment_date_time, DateFormat.ISO_DATE)}`
  }

  return ''
}

const yearKeys = [
  { year: 'year1', label: 'yearOne' },
  { year: 'year2', label: 'yearTwo' },
  { year: 'year3', label: 'yearThree' },
  { year: 'year4', label: 'yearFour' },
  { year: 'year5', label: 'yearFive' },
  { year: 'year6', label: 'yearSix' },
] as const

export const getCriteriaHeaders = (months: number, programme: string) =>
  yearKeys.slice(0, isMedicalProgramme(programme) ? 6 : 3).map(({ year, label }, index) => ({
    title: `Academic year ${index + 1}${months < (index + 1) * 12 ? ' (in progress)' : ''}`,
    year,
    label,
  }))
