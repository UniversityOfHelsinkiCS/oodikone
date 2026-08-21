import { assert, describe, it } from 'vitest'

import { genderFilter } from '@/components/FilterView/filters/gender'
import { FormattedStudent } from '@oodikone/shared/types/studentData'

import { createStudent } from '@oodikone/shared/test/utils'
import { GenderCode } from '@oodikone/shared/types'

const filterStudent = (student: FormattedStudent, selected: string) =>
  genderFilter().filter(student, {
    args: undefined,
    options: { selected: parseInt(selected) },
    precomputed: undefined,
  })

void describe('genderFilter', () => {
  void it('should keep a student whose gender code matches the selected value', () => {
    const student = createStudent({ gender_code: GenderCode.FEMALE })

    assert.strictEqual(filterStudent(student, GenderCode.FEMALE), true)
  })

  void it('should exclude a student whose gender code does not match the selected value', () => {
    const student = createStudent({ gender_code: GenderCode.MALE })

    assert.strictEqual(filterStudent(student, GenderCode.FEMALE), false)
  })

  void it('should keep a student with an unknown gender code when unknown is selected', () => {
    const student = createStudent({ gender_code: GenderCode.UNKNOWN })

    assert.strictEqual(filterStudent(student, GenderCode.UNKNOWN), true)
  })

  void it('isActive should match the filter state', () => {
    assert.strictEqual(genderFilter().isActive({ selected: '' }, undefined), false)
    assert.strictEqual(genderFilter().isActive({ selected: GenderCode.MALE }, undefined), true)
  })
})
