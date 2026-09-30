import { assert, describe, it } from 'vitest'

import { calculateExcelData, getHopsCourses } from '@/components/CustomPopulation/courseMatrix'
import { CreditTypeCode } from '@oodikone/shared/types'
import type { StudentCourse } from '@oodikone/shared/types/studentData'

import { createCourse as createBaseCourse, createStudent, createStudyPlan } from '@oodikone/shared/test/utils'

// Each course id is its own course group unless overridden
const createCourse = (
  course_id: string,
  credits: number,
  passed: boolean,
  date: Date,
  overrides: Partial<StudentCourse> = {}
) =>
  createBaseCourse({
    course_id,
    courseGroupId: course_id,
    date,
    passed,
    grade: passed ? '5' : 'Hyl.',
    credits,
    credittypecode: passed ? CreditTypeCode.PASSED : CreditTypeCode.FAILED,
    ...overrides,
  })

const createHops = (includedCourses: string[]) => createStudyPlan({ included_courses: includedCourses })

void describe('getHopsCourses', () => {
  void it('returns only passed courses included in the student HOPS', () => {
    const student = createStudent({
      courses: [
        createCourse('A', 5, true, new Date('2024-09-01')),
        createCourse('B', 5, true, new Date('2024-10-01')),
        createCourse('C', 5, false, new Date('2024-11-01')),
      ],
      studyplans: [createHops(['A', 'C'])],
    })

    const result = getHopsCourses(student)

    assert.equal(result.length, 1)
    assert.equal(result[0].course_id, 'A')
  })

  void it('returns an empty list when the student has no HOPS', () => {
    const student = createStudent({
      courses: [createCourse('A', 5, true, new Date('2024-09-01'))],
      studyplans: [],
    })

    assert.deepEqual(getHopsCourses(student), [])
  })

  void it('dedupes multiple completions keeping the latest', () => {
    const student = createStudent({
      courses: [createCourse('A', 5, true, new Date('2024-09-01')), createCourse('A', 6, true, new Date('2025-01-15'))],
      studyplans: [createHops(['A'])],
    })

    const result = getHopsCourses(student)

    assert.equal(result.length, 1)
    assert.equal(result[0].credits, 6)
  })

  void it('dedupes completions of different versions of the same course group keeping the latest', () => {
    const student = createStudent({
      courses: [
        createCourse('A-2023', 5, true, new Date('2024-09-01'), { courseGroupId: 'group-a' }),
        createCourse('A-2025', 6, true, new Date('2025-01-15'), { courseGroupId: 'group-a' }),
      ],
      studyplans: [createHops(['A-2023', 'A-2025'])],
    })

    const result = getHopsCourses(student)

    assert.equal(result.length, 1)
    assert.equal(result[0].course_id, 'A-2025')
  })
})

void describe('calculateExcelData', () => {
  void it('builds completed-course rows and aggregates credits per course, displaying code rather than id', () => {
    const students = [
      createStudent({
        studentNumber: '1',
        courses: [createCourse('course-a', 5, true, new Date('2024-09-01'))],
        studyplans: [createHops(['course-a'])],
      }),
      createStudent({
        studentNumber: '2',
        courses: [
          createCourse('course-a', 5, true, new Date('2024-09-01')),
          createCourse('course-b', 3, true, new Date('2024-10-01')),
        ],
        studyplans: [createHops(['course-a', 'course-b'])],
      }),
    ]
    const courseInfoByGroupId = new Map([
      ['course-a', { code: 'A', name: 'Course A' }],
      ['course-b', { code: 'B', name: 'Course B' }],
    ])

    const data = calculateExcelData(students, courseInfoByGroupId)

    assert.deepEqual(data.completedCoursesRows, [
      ['1', 'Testi Opiskelija', 'Course A (A)'],
      ['2', 'Testi Opiskelija', 'Course A (A)', 'Course B (B)'],
    ])
    assert.deepEqual(data.courseCounterRows, [
      ['A', 'Course A', '2', '10'],
      ['B', 'Course B', '1', '3'],
    ])
  })

  void it('displays the course group code for other versions and aggregates versions of the same group', () => {
    const students = [
      createStudent({
        studentNumber: '1',
        courses: [createCourse('course-a-v1', 5, true, new Date('2024-09-01'), { courseGroupId: 'group-a' })],
        studyplans: [createHops(['course-a-v1'])],
      }),
      createStudent({
        studentNumber: '2',
        courses: [createCourse('course-a-v2', 5, true, new Date('2025-09-01'), { courseGroupId: 'group-a' })],
        studyplans: [createHops(['course-a-v2'])],
      }),
    ]
    const courseInfoByGroupId = new Map([['group-a', { code: 'A', name: 'Course A' }]])

    const data = calculateExcelData(students, courseInfoByGroupId)

    assert.deepEqual(data.completedCoursesRows, [
      ['1', 'Testi Opiskelija', 'Course A (A)'],
      ['2', 'Testi Opiskelija', 'Course A (A)'],
    ])
    assert.deepEqual(data.courseCounterRows, [['A', 'Course A', '2', '10']])
  })

  void it('falls back to the course code of the credit for courses missing from the course map', () => {
    const students = [
      createStudent({
        studentNumber: '1',
        courses: [createCourse('unknown-course-id', 5, true, new Date('2024-09-01'), { course_code: 'UNKNOWN01' })],
        studyplans: [createHops(['unknown-course-id'])],
      }),
    ]

    const data = calculateExcelData(students, new Map())

    assert.deepEqual(data.completedCoursesRows, [['1', 'Testi Opiskelija', ' (UNKNOWN01)']])
    assert.deepEqual(data.courseCounterRows, [['UNKNOWN01', '', '1', '5']])
  })
})
