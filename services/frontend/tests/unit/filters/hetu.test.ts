import { assert, describe, it } from 'vitest'

import { hetuFilter } from '@/components/FilterView/filters/hetu'
import { FormattedStudent } from '@oodikone/shared/types/studentData'

import { createStudent } from '@oodikone/shared/test/utils'

const filterStudent = (student: FormattedStudent, mode: number) =>
  hetuFilter().filter(student, { args: undefined, options: { mode }, precomputed: undefined })

void describe('hetuFilter', () => {
  void it('should include all students when mode is "All" (0)', () => {
    const withHetu = createStudent({ hasPersonalIdentityCode: true })
    const withoutHetu = createStudent({ hasPersonalIdentityCode: false })

    assert.strictEqual(filterStudent(withHetu, 0), true)
    assert.strictEqual(filterStudent(withoutHetu, 0), true)
  })

  void it('should only keep students with a personal identity code when mode is "Has hetu" (1)', () => {
    const withHetu = createStudent({ hasPersonalIdentityCode: true })
    const withoutHetu = createStudent({ hasPersonalIdentityCode: false })

    assert.strictEqual(filterStudent(withHetu, 1), true)
    assert.strictEqual(filterStudent(withoutHetu, 1), false)
  })

  void it('should only keep students without a personal identity code when mode is "Does not have hetu" (2)', () => {
    const withHetu = createStudent({ hasPersonalIdentityCode: true })
    const withoutHetu = createStudent({ hasPersonalIdentityCode: false })

    assert.strictEqual(filterStudent(withHetu, 2), false)
    assert.strictEqual(filterStudent(withoutHetu, 2), true)
  })

  void it('isActive should match the filter state', () => {
    assert.strictEqual(hetuFilter().isActive({ mode: 0 }, undefined), false)
    assert.strictEqual(hetuFilter().isActive({ mode: 1 }, undefined), true)
    assert.strictEqual(hetuFilter().isActive({ mode: 2 }, undefined), true)
  })
})
