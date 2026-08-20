import { assert, describe, it } from 'vitest'

import { startYearAtUniFilter } from '@/components/FilterView/filters/startYearAtUni'
import { FormattedStudent } from '@oodikone/shared/types/studentData'

import { createStudent } from './helpers'

const filterStudent = (student: FormattedStudent, selected: number | string) =>
  startYearAtUniFilter().filter(student, { args: undefined, options: { selected }, precomputed: undefined })

void describe('startYearAtUniFilter', () => {
  void it("should return true when selected year matches the student's starting year (FALL)", () => {
    const student = createStudent({ started: new Date('2020-08-01') })

    assert.strictEqual(filterStudent(student, 2020), true)
  })

  void it("should return true when selected year matches the student's starting year (SPRING)", () => {
    const student = createStudent({ started: new Date('2020-03-01') })

    assert.strictEqual(filterStudent(student, 2020), true)
  })

  void it("should return false when selected year doesn't match the student's starting year", () => {
    const student = createStudent({ started: new Date('2020-08-01') })

    assert.strictEqual(filterStudent(student, 2021), false)
  })

  void it('isActive should match the filter state', () => {
    assert.strictEqual(startYearAtUniFilter().isActive({ selected: '' }, undefined), false)
    assert.strictEqual(startYearAtUniFilter().isActive({ selected: 2020 }, undefined), true)
  })
})
