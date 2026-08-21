import { assert, describe, it } from 'vitest'

import { curriculumPeriodFilter } from '@/components/FilterView/filters/curriculumPeriod'
import { FormattedStudent } from '@oodikone/shared/types/studentData'

import { createStudent } from '@oodikone/shared/test/utils'

const filterStudent = (student: FormattedStudent, selected: string) =>
  curriculumPeriodFilter().filter(student, { args: undefined, options: { selected }, precomputed: null })

void describe('curriculumPeriodFilter', () => {
  void it('should pass a student whose curriculum version matches the selected one', () => {
    const student = createStudent({ curriculumVersion: '2020-2023' })

    assert.strictEqual(filterStudent(student, '2020-2023'), true)
  })

  void it('should not pass a student whose curriculum version differs from the selected one', () => {
    const student = createStudent({ curriculumVersion: '2017-2020' })

    assert.strictEqual(filterStudent(student, '2020-2023'), false)
  })

  void it('isActive should match the filter state', () => {
    assert.strictEqual(curriculumPeriodFilter().isActive({ selected: '' }, undefined), false)
    assert.strictEqual(curriculumPeriodFilter().isActive({ selected: '2020-2023' }, undefined), true)
  })
})
