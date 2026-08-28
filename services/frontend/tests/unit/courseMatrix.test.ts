import { assert, describe, it } from 'vitest'

import { calculateExcelData, getHopsCourses } from '@/components/CustomPopulation/courseMatrix'
import { CreditTypeCode } from '@oodikone/shared/types'

import { createCourse as createBaseCourse, createStudent, createStudyPlan } from '@oodikone/shared/test/utils'

const createCourse = (
  course_id: string,
  credits: number,
  passed: boolean,
  date: Date,
  credittypecode: CreditTypeCode = passed ? CreditTypeCode.PASSED : CreditTypeCode.FAILED
) => createBaseCourse({ course_id, date, passed, grade: passed ? '5' : 'Hyl.', credits, credittypecode })

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
    const courseInfoById = new Map([
      ['course-a', { code: 'A', name: 'Course A' }],
      ['course-b', { code: 'B', name: 'Course B' }],
    ])

    const data = calculateExcelData(students, courseInfoById)

    assert.deepEqual(data.completedCoursesRows, [
      ['1', 'Testi Opiskelija', 'Course A (A)'],
      ['2', 'Testi Opiskelija', 'Course A (A)', 'Course B (B)'],
    ])
    assert.deepEqual(data.courseCounterRows, [
      ['A', 'Course A', '2', '10'],
      ['B', 'Course B', '1', '3'],
    ])
  })

  void it('falls back to id as the code for courses missing from the course map', () => {
    const students = [
      createStudent({
        studentNumber: '1',
        courses: [createCourse('unknown-course-id', 5, true, new Date('2024-09-01'))],
        studyplans: [createHops(['unknown-course-id'])],
      }),
    ]

    const data = calculateExcelData(students, new Map())

    assert.deepEqual(data.completedCoursesRows, [['1', 'Testi Opiskelija', ' (unknown-course-id)']])
    assert.deepEqual(data.courseCounterRows, [['unknown-course-id', '', '1', '5']])
  })
})
