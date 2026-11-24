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
        createCourse({ course_id: 'TKT-IN', date: new Date('2024-06-01') }),
        createCourse({ course_id: 'TKT-OUT', date: new Date('2023-01-01') }),
      ],
    })

    const result = creditDateFilter().mutate!(student, {
      args: undefined,
      options: { startDate: dayjs('2024-01-01'), endDate: dayjs('2024-12-31') },
      precomputed: undefined,
    })

    assert.deepStrictEqual(
      result.courses.map(({ course_id }) => course_id),
      ['TKT-IN']
    )
  })

  void it('should keep only enrollments within the selected date range when mutating', () => {
    const student = createStudent({
      enrollments: [
        createEnrollment({ course_id: 'TKT-IN', enrollment_date_time: new Date('2024-06-01') }),
        createEnrollment({ course_id: 'TKT-OUT', enrollment_date_time: new Date('2023-01-01') }),
      ],
    })

    const result = creditDateFilter().mutate!(student, {
      args: undefined,
      options: { startDate: dayjs('2024-01-01'), endDate: dayjs('2024-12-31') },
      precomputed: undefined,
    })

    assert.deepStrictEqual(
      result.enrollments.map(({ course_id }) => course_id),
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

void describe('creditDateFilter range', () => {
  const courseIdsBetween = (startDate: string | null, endDate: string | null) => {
    const student = createStudent({
      courses: [
        createCourse({ course_id: 'BEFORE', date: new Date('2023-12-31') }),
        createCourse({ course_id: 'START', date: new Date('2024-01-01') }),
        createCourse({ course_id: 'MIDDLE', date: new Date('2024-06-01') }),
        createCourse({ course_id: 'END', date: new Date('2024-12-31') }),
        createCourse({ course_id: 'AFTER', date: new Date('2025-01-01') }),
      ],
    })

    return creditDateFilter().mutate!(student, {
      args: undefined,
      options: {
        startDate: startDate === null ? null : dayjs(startDate),
        endDate: endDate === null ? null : dayjs(endDate),
      },
      precomputed: undefined,
    }).courses.map(({ course_id }) => course_id)
  }

  void it('should keep everything after the start date when only the start date is set', () => {
    assert.deepStrictEqual(courseIdsBetween('2024-01-01', null), ['START', 'MIDDLE', 'END', 'AFTER'])
  })

  void it('should keep everything before the end date when only the end date is set', () => {
    assert.deepStrictEqual(courseIdsBetween(null, '2024-12-31'), ['BEFORE', 'START', 'MIDDLE', 'END'])
  })

  void it('should keep courses completed on the start and end days', () => {
    assert.deepStrictEqual(courseIdsBetween('2024-01-01', '2024-12-31'), ['START', 'MIDDLE', 'END'])
  })

  void it('should keep enrollments made on the start and end days', () => {
    const student = createStudent({
      enrollments: [
        createEnrollment({ course_id: 'BEFORE', enrollment_date_time: new Date('2023-12-31') }),
        createEnrollment({ course_id: 'START', enrollment_date_time: new Date('2024-01-01') }),
        createEnrollment({ course_id: 'END', enrollment_date_time: new Date('2024-12-31') }),
        createEnrollment({ course_id: 'AFTER', enrollment_date_time: new Date('2025-01-01') }),
      ],
    })

    const result = creditDateFilter().mutate!(student, {
      args: undefined,
      options: { startDate: dayjs('2024-01-01'), endDate: dayjs('2024-12-31') },
      precomputed: undefined,
    })

    assert.deepStrictEqual(
      result.enrollments.map(({ course_id }) => course_id),
      ['START', 'END']
    )
  })
})
