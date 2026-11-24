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

    const precomputed = gradeFilter().precompute!({ students: [student], args: ARGS })

    assert.deepStrictEqual(precomputed.grades, { 5: [student.studentNumber] })
  })

  void it('should ignore courses outside the requested date range', () => {
    const student = createStudent({
      courses: [createCourse({ course_id: 'hy-CU-TKT002', grade: '5', date: new Date('2023-01-01') })],
    })

    const precomputed = gradeFilter().precompute!({ students: [student], args: ARGS })

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
    const student = createStudent({ courses: [createCourse({ course_id: 'hy-CU-TKT002', date: '2024-09-01' })] })

    const precomputed = gradeFilter().precompute!({
      students: [student],
      args: ARGS,
    })

    assert.deepStrictEqual(precomputed, { grades: { '5': [student.studentNumber] } })
  })

  void it('isActive should match the filter state', () => {
    assert.strictEqual(gradeFilter().isActive({ selected: ['5'] }, undefined), true)
    assert.strictEqual(gradeFilter().isActive({ selected: [] }, undefined), false)
  })
})

void describe('gradeFilter course selection', () => {
  void it('should ignore grades from courses outside the population courses', () => {
    const student = createStudent({ courses: [createCourse({ course_id: 'hy-CU-OTHER', grade: '5' })] })

    const precomputed = gradeFilter().precompute!({ students: [student], args: ARGS })

    assert.deepStrictEqual(precomputed.grades, { 'No grade': [student.studentNumber] })
  })

  void it('should include students with any of the selected grades', () => {
    const three = createStudent({ studentNumber: '3' })
    const four = createStudent({ studentNumber: '4' })
    const five = createStudent({ studentNumber: '5' })
    const precomputed = { grades: { 3: ['3'], 4: ['4'], 5: ['5'] } }
    const filterStudent = (student: ReturnType<typeof createStudent>) =>
      gradeFilter().filter(student, { args: ARGS, options: { selected: ['3', '5'] }, precomputed })

    assert.deepStrictEqual([three, four, five].map(filterStudent), [true, false, true])
  })
})
