import dayjs from 'dayjs'
import { assert, describe, it } from 'vitest'

import { createCourse, createEnrollment, createStudent } from '@oodikone/shared/test/utils'

const { creditDateFilter } = await import('@/components/FilterView/filters/date')

void describe('creditDateFilter', () => {
  void it('should not filter students out directly', () => {
    const student = createStudent()

    const result = creditDateFilter().filter(student, {
      args: undefined,
      options: { startDate: dayjs('2024-01-01'), endDate: dayjs('2024-12-31') },
      precomputed: undefined,
    })

    assert.strictEqual(result, true)
  })

  void it('should keep only courses within the selected date range when mutating', () => {
    const student = createStudent({
      courses: [
        createCourse({ course_code: 'TKT-IN', date: new Date('2024-06-01') }),
        createCourse({ course_code: 'TKT-OUT', date: new Date('2023-01-01') }),
      ],
    })

    const result = creditDateFilter().mutate!(student, {
      args: undefined,
      options: { startDate: dayjs('2024-01-01'), endDate: dayjs('2024-12-31') },
      precomputed: undefined,
    })

    assert.deepStrictEqual(
      result.courses.map(({ course_code }) => course_code),
      ['TKT-IN']
    )
  })

  void it('should keep only enrollments within the selected date range when mutating', () => {
    const student = createStudent({
      enrollments: [
        createEnrollment({ course_code: 'TKT-IN', enrollment_date_time: new Date('2024-06-01') }),
        createEnrollment({ course_code: 'TKT-OUT', enrollment_date_time: new Date('2023-01-01') }),
      ],
    })

    const result = creditDateFilter().mutate!(student, {
      args: undefined,
      options: { startDate: dayjs('2024-01-01'), endDate: dayjs('2024-12-31') },
      precomputed: undefined,
    })

    assert.deepStrictEqual(
      result.enrollments.map(({ course_code }) => course_code),
      ['TKT-IN']
    )
  })

  void it('should not filter anything out when no date range is selected', () => {
    const student = createStudent({ courses: [createCourse()], enrollments: [createEnrollment()] })

    const result = creditDateFilter().mutate!(student, {
      args: undefined,
      options: { startDate: null, endDate: null },
      precomputed: undefined,
    })

    assert.deepStrictEqual(result.courses, student.courses)
    assert.deepStrictEqual(result.enrollments, student.enrollments)
  })

  void it('isActive should match the filter state', () => {
    assert.strictEqual(creditDateFilter().isActive({ startDate: null, endDate: null }, undefined), false)
    assert.strictEqual(creditDateFilter().isActive({ startDate: dayjs('2024-01-01'), endDate: null }, undefined), true)
    assert.strictEqual(creditDateFilter().isActive({ startDate: null, endDate: dayjs('2024-12-31') }, undefined), true)
    assert.strictEqual(
      creditDateFilter().isActive({ startDate: dayjs('2024-01-01'), endDate: dayjs('2024-12-31') }, undefined),
      true
    )
  })
})
