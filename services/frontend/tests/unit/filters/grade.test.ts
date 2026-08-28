import { assert, describe, it } from 'vitest'

import { gradeFilter } from '@/components/FilterView/filters/grade'

import { createCourse, createStudent } from '@oodikone/shared/test/utils'

const ARGS = { courseIds: ['hy-CU-TKT002'], from: '2024-01-01', to: '2024-12-31' }

void describe('gradeFilter', () => {
  void it('should group student numbers by their highest grade for the given courses', () => {
    const student = createStudent({
      courses: [
        createCourse({ course_id: 'hy-CU-TKT002', grade: '5' }),
        createCourse({ course_id: 'hy-CU-TKT002', grade: '3' }),
      ],
    })

    const precomputed = gradeFilter().precompute!({ students: [student], options: { selected: [] }, args: ARGS })

    assert.deepStrictEqual(precomputed.grades, { 5: [student.studentNumber] })
  })

  void it('should ignore courses outside the requested date range', () => {
    const student = createStudent({
      courses: [createCourse({ course_id: 'hy-CU-TKT002', grade: '5', date: new Date('2023-01-01') })],
    })

    const precomputed = gradeFilter().precompute!({ students: [student], options: { selected: [] }, args: ARGS })

    assert.deepStrictEqual(precomputed.grades, { 'No grade': [student.studentNumber] })
  })

  void it('should include a student whose grade is selected', () => {
    const student = createStudent({ courses: [createCourse({ grade: '5' })] })

    const result = gradeFilter().filter(student, {
      args: ARGS,
      options: { selected: ['5'] },
      precomputed: { grades: { 5: [student.studentNumber] } },
    })

    assert.strictEqual(result, true)
  })

  void it('should exclude a student whose grade is not selected', () => {
    const student = createStudent({ courses: [createCourse({ course_id: 'hy-CU-TKT002', grade: '3' })] })

    const result = gradeFilter().filter(student, {
      args: ARGS,
      options: { selected: ['5'] },
      precomputed: { grades: { 3: [student.studentNumber] } },
    })

    assert.strictEqual(result, false)
  })

  void it('should include student with no grade in No grade', () => {
    const student = createStudent({ courses: [] })

    const result = gradeFilter().filter(student, {
      args: ARGS,
      options: { selected: ['No grade'] },
      precomputed: { grades: { 'No grade': [student.studentNumber] } },
    })

    assert.strictEqual(result, true)
  })

  void it('should handle string-dates properly', () => {
    // @ts-expect-error: FIXME: Courses have date incorrectly types as Date, not string
    const student = createStudent({ courses: [createCourse({ course_code: 'TKT002', date: '2024-09-01' })] })

    const precomputed = gradeFilter().precompute!({
      students: [student],
      args: ARGS,
      options: { selected: ['5'] },
    })

    assert.deepStrictEqual(precomputed, { grades: { '5': [student.studentNumber] } })
  })

  void it('isActive should match the filter state', () => {
    assert.strictEqual(gradeFilter().isActive({ selected: ['5'] }, undefined), true)
    assert.strictEqual(gradeFilter().isActive({ selected: [] }, undefined), false)
  })
})
