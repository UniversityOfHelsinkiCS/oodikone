import { assert, describe, it } from 'vitest'

import { ageFilter } from '@/components/FilterView/filters/age'
import { getAge } from '@/util/timeAndDate'
import { FormattedStudent } from '@oodikone/shared/types/studentData'

import { createStudent } from '@oodikone/shared/test/utils'

const filterStudent = (student: FormattedStudent, options: { min: number | null; max: number | null }) =>
  ageFilter().filter(student, { args: undefined, options, precomputed: { min: null, max: null } })

void describe('ageFilter', () => {
  void it('should keep a student whose age is within the given range', () => {
    const student = createStudent({ birthdate: new Date('2000-01-01') })
    const age = getAge(student.birthdate)

    assert.strictEqual(filterStudent(student, { min: age - 1, max: age + 1 }), true)
  })

  void it('should exclude a student younger than the minimum age', () => {
    const student = createStudent({ birthdate: new Date('2000-01-01') })
    const age = getAge(student.birthdate)

    assert.strictEqual(filterStudent(student, { min: age + 1, max: null }), false)
  })

  void it('should exclude a student older than the maximum age', () => {
    const student = createStudent({ birthdate: new Date('2000-01-01') })
    const age = getAge(student.birthdate)

    assert.strictEqual(filterStudent(student, { min: null, max: age - 1 }), false)
  })

  void it('should keep every student when min and max are not set', () => {
    const student = createStudent({ birthdate: new Date('2000-01-01') })

    assert.strictEqual(filterStudent(student, { min: null, max: null }), true)
  })

  void it('isActive should match filter state', () => {
    assert.strictEqual(ageFilter().isActive({ min: null, max: null }, undefined), false)
    assert.strictEqual(ageFilter().isActive({ min: 18, max: null }, undefined), true)
    assert.strictEqual(ageFilter().isActive({ min: null, max: 30 }, undefined), true)
    assert.strictEqual(ageFilter().isActive({ min: 18, max: 30 }, undefined), true)
  })

  void it('should precompute the min and max ages of the given students correctly', () => {
    const young = createStudent({ birthdate: new Date('2004-01-01') })
    const old = createStudent({ birthdate: new Date('1990-01-01') })

    const result = ageFilter().precompute!({
      args: undefined,
      options: { min: null, max: null },
      students: [young, old],
    })

    assert.strictEqual(result.min, getAge(young.birthdate))
    assert.strictEqual(result.max, getAge(old.birthdate))
  })
})
