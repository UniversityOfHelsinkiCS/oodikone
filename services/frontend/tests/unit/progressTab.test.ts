import dayjs from 'dayjs'
import { assert, describe, it } from 'vitest'

import {
  getCellText,
  getCourseGroups,
  hasFailed,
  hasPassedDuringAcademicYear,
  hasPassedOutsideAcademicYear,
  Label,
} from '@/components/PopulationComponents/Students/Table/ProgressTab/util'
import { CreditTypeCode, EnrollmentState, FormattedStudent, ProgressCriteria } from '@oodikone/shared/types'
import { StudentCourse } from '@oodikone/shared/types/studentData'

const COURSES = {
  CS001: { id: 'id-CS001', groupId: 'group-CS001', code: 'CS001' },
  CS002: { id: 'id-CS002', groupId: 'group-CS002', code: 'CS002' },
  CS002A: { id: 'id-CS002A', groupId: 'group-CS002A', code: 'CS002A' },
  CS002B: { id: 'id-CS002B', groupId: 'group-CS002B', code: 'CS002B' },
} as const

const idToGroupId = Object.fromEntries(Object.values(COURSES).map(({ id, groupId }) => [id, groupId]))

const criteria = {
  allCourseGroups: {
    [COURSES.CS001.groupId]: [],
    [COURSES.CS002.groupId]: [[COURSES.CS002A.groupId, COURSES.CS002B.groupId]],
  },
} as unknown as ProgressCriteria

const createCourse = (
  course: keyof typeof COURSES,
  date: string,
  passed = true,
  credittypecode = CreditTypeCode.PASSED
) =>
  ({
    course_id: COURSES[course].id,
    course_code: COURSES[course].code,
    date: new Date(date),
    passed,
    credittypecode,
  }) as StudentCourse

const createStudent = (courses: StudentCourse[], enrollments: FormattedStudent['enrollments'] = []) =>
  ({ courses, enrollments, criteriaProgress: {} }) as unknown as FormattedStudent

const label = (course: keyof typeof COURSES): Label => ({
  code: COURSES[course].code,
  groupId: COURSES[course].groupId,
  name: COURSES[course].code,
})

const getGroups = (student: FormattedStudent, course: keyof typeof COURSES) =>
  getCourseGroups(COURSES[course].groupId, criteria, student, idToGroupId)

void describe('getCourseGroups', () => {
  void it('returns one group per substitution group', () => {
    const student = createStudent([createCourse('CS002A', '2024-01-01'), createCourse('CS002B', '2024-02-01')])
    const groups = getGroups(student, 'CS002')

    assert.equal(groups.length, 1)
    assert.deepEqual(
      groups[0].map(course => course.course_code),
      ['CS002B', 'CS002A']
    )
  })

  void it('omits substitution groups the student has not attempted fully', () => {
    const student = createStudent([createCourse('CS002A', '2024-01-01')])

    assert.deepEqual(getGroups(student, 'CS002'), [])
  })
})

void describe('passed checks', () => {
  const start = dayjs('2023-08-01')
  const end = dayjs('2024-07-31')

  void it('does not count a substitution group as passed when one course is failed', () => {
    const student = createStudent([createCourse('CS002A', '2024-01-01'), createCourse('CS002B', '2024-02-01', false)])
    const groups = getGroups(student, 'CS002')

    assert.isFalse(hasPassedOutsideAcademicYear(groups))
    assert.isFalse(hasPassedDuringAcademicYear(groups, start, end))
    assert.isTrue(hasFailed(groups))
  })

  void it('counts a course passed after a failed attempt', () => {
    const student = createStudent([createCourse('CS001', '2023-10-01', false), createCourse('CS001', '2024-01-01')])
    const groups = getGroups(student, 'CS001')

    assert.isTrue(hasPassedDuringAcademicYear(groups, start, end))
    assert.isFalse(hasFailed(groups))
  })

  void it('does not count a course passed after the academic year as passed during it', () => {
    const student = createStudent([createCourse('CS001', '2024-09-01')])
    const groups = getGroups(student, 'CS001')

    assert.isFalse(hasPassedDuringAcademicYear(groups, start, end))
    assert.isTrue(hasPassedOutsideAcademicYear(groups))
  })
})

void describe('getCellText', () => {
  const text = (student: FormattedStudent, course: keyof typeof COURSES) =>
    getCellText(label(course), criteria, student, 'year1', idToGroupId)

  void it('shows the date of the latest passed attempt', () => {
    const student = createStudent([createCourse('CS001', '2023-10-01', false), createCourse('CS001', '2024-01-02')])

    assert.equal(text(student, 'CS001'), 'Passed 2024-01-02')
  })

  void it('marks substitutions', () => {
    const student = createStudent([createCourse('CS002A', '2024-01-01'), createCourse('CS002B', '2024-02-01')])

    assert.equal(text(student, 'CS002'), 'Passed (substituted)')
  })

  void it('shows the failed date', () => {
    const student = createStudent([createCourse('CS001', '2023-10-01', false)])

    assert.equal(text(student, 'CS001'), 'Failed 2023-10-01')
  })

  void it('shows enrollments, ignoring rejected ones', () => {
    const enrollment = (state: EnrollmentState, date: string) => ({
      course_id: COURSES.CS001.id,
      state,
      enrollment_date_time: date,
    })
    const enrolled = createStudent([], [enrollment(EnrollmentState.ENROLLED, '2023-09-01')] as never)
    const rejected = createStudent([], [enrollment(EnrollmentState.REJECTED, '2023-09-01')] as never)

    assert.equal(text(enrolled, 'CS001'), 'Enrollment 2023-09-01')
    assert.equal(text(rejected, 'CS001'), '')
  })
})
