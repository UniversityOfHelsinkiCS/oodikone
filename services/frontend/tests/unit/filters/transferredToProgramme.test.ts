import { assert, describe, it } from 'vitest'

import { transferredToProgrammeFilter } from '@/components/FilterView/filters/transferredToProgramme'
import { FormattedStudent } from '@oodikone/shared/types/studentData'

import { createStudent } from './helpers'

const filterStudent = (student: FormattedStudent, transferred: string) =>
  transferredToProgrammeFilter().filter(student, { args: undefined, options: { transferred }, precomputed: undefined })

void describe('transferredToProgrammeFilter', () => {
  void it('should include student when transferred option is "true" and student was transferred', () => {
    const student = createStudent({ transferredStudyright: true })

    assert.strictEqual(filterStudent(student, 'true'), true)
  })

  void it('should exclude student when transferred option is "false" and student was transferred', () => {
    const student = createStudent({ transferredStudyright: true })

    assert.strictEqual(filterStudent(student, 'false'), false)
  })

  void it('should include student when transferred option is "false" and student was not transferred', () => {
    const student = createStudent({ transferredStudyright: false })

    assert.strictEqual(filterStudent(student, 'false'), true)
  })

  void it('should exclude student when transferred option is "true" but student was not transferred', () => {
    const student = createStudent({ transferredStudyright: false })

    assert.strictEqual(filterStudent(student, 'true'), false)
  })

  void it('isActive should match the filter state', () => {
    assert.strictEqual(transferredToProgrammeFilter().isActive({ transferred: '' }, undefined), false)
    assert.strictEqual(transferredToProgrammeFilter().isActive({ transferred: 'true' }, undefined), true)
    assert.strictEqual(transferredToProgrammeFilter().isActive({ transferred: 'false' }, undefined), true)
  })
})
