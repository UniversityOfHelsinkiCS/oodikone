import { assert, describe, it } from 'vitest'

import { creditsEarnedFilter } from '@/components/FilterView/filters/creditsEarned'
import { FormattedStudent } from '@oodikone/shared/types/studentData'

import { createCourse, createStudent } from '@oodikone/shared/test/utils'

const filterStudent = (student: FormattedStudent, options: { min: number | null; max: number | null }) =>
  creditsEarnedFilter().filter(student, { args: undefined, options, precomputed: { min: undefined, max: undefined } })

void describe('creditsEarnedFilter', () => {
  void it('should pass a student whose credits fall within the given range', () => {
    const student = createStudent({ courses: [createCourse({ credits: 10 })] })

    assert.strictEqual(filterStudent(student, { min: 5, max: 20 }), true)
  })

  void it('should not pass a student whose credits are below the given minimum', () => {
    const student = createStudent({ courses: [createCourse({ credits: 3 })] })

    assert.strictEqual(filterStudent(student, { min: 5, max: null }), false)
  })

  void it('should not pass a student whose credits are above the given maximum', () => {
    const student = createStudent({ courses: [createCourse({ credits: 30 })] })

    assert.strictEqual(filterStudent(student, { min: null, max: 20 }), false)
  })

  void it('isActive should match the filter state', () => {
    assert.strictEqual(creditsEarnedFilter().isActive({ min: null, max: null }, undefined), false)
    assert.strictEqual(creditsEarnedFilter().isActive({ min: 5, max: null }, undefined), true)
    assert.strictEqual(creditsEarnedFilter().isActive({ min: null, max: 20 }, undefined), true)
    assert.strictEqual(creditsEarnedFilter().isActive({ min: 5, max: 20 }, undefined), true)
  })
})
