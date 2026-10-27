import { assert, describe, it } from 'vitest'

import { curriculumPeriodFilter } from '@/components/FilterView/filters/curriculumPeriod'
import { FormattedStudent } from '@oodikone/shared/types/studentData'

import { createStudent } from '@oodikone/shared/test/utils'

const filterStudent = (student: FormattedStudent, selected: string[]) =>
  curriculumPeriodFilter().filter(student, { args: undefined, options: { selected }, precomputed: null })

void describe('curriculumPeriodFilter', () => {
  void it('should pass a student whose curriculum version matches the selected one', () => {
    const student = createStudent({ curriculumVersion: '2020-2023' })

    assert.strictEqual(filterStudent(student, ['2020-2023']), true)
  })

  void it('should pass a student whose curriculum version matches any of the selected ones', () => {
    const student = createStudent({ curriculumVersion: '2017-2020' })

    assert.strictEqual(filterStudent(student, ['2020-2023', '2017-2020']), true)
  })

  void it('should not pass a student whose curriculum version differs from the selected ones', () => {
    const student = createStudent({ curriculumVersion: '2017-2020' })

    assert.strictEqual(filterStudent(student, ['2020-2023', '2023-2026']), false)
  })

  void it('should not pass a student without a curriculum version', () => {
    const student = createStudent({ curriculumVersion: null })

    assert.strictEqual(filterStudent(student, ['2020-2023']), false)
  })

  void it('should pass a student without a curriculum version when none is selected', () => {
    const student = createStudent({ curriculumVersion: null })

    assert.strictEqual(filterStudent(student, ['none']), true)
    assert.strictEqual(filterStudent(student, ['2020-2023', 'none']), true)
  })

  void it('should not pass a student with a curriculum version when only none is selected', () => {
    const student = createStudent({ curriculumVersion: '2020-2023' })

    assert.strictEqual(filterStudent(student, ['none']), false)
  })

  void it('isActive should match the filter state', () => {
    assert.strictEqual(curriculumPeriodFilter().isActive({ selected: [] }, undefined), false)
    assert.strictEqual(curriculumPeriodFilter().isActive({ selected: ['2020-2023'] }, undefined), true)
  })
})
