import { assert, describe, it } from 'vitest'

import { studentNumberFilter } from '@/components/FilterView/filters/studentNumber'
import { FormattedStudent } from '@oodikone/shared/types/studentData'

import { createStudent } from './helpers'

const filterStudent = (student: FormattedStudent, options: { allowlist: string[]; blocklist: string[] }) =>
  studentNumberFilter().filter(student, { args: undefined, options, precomputed: undefined })

void describe('studentNumberFilter', () => {
  void it('should pass every student when allowlist and blocklist are empty', () => {
    const student = createStudent({ studentNumber: '111111111' })

    assert.strictEqual(filterStudent(student, { allowlist: [], blocklist: [] }), true)
  })

  void it('should only pass students on the allowlist', () => {
    const allowedStudent = createStudent({ studentNumber: '111111111' })
    const otherStudent = createStudent({ studentNumber: '222222222' })

    assert.strictEqual(filterStudent(allowedStudent, { allowlist: ['111111111'], blocklist: [] }), true)
    assert.strictEqual(filterStudent(otherStudent, { allowlist: ['111111111'], blocklist: [] }), false)
  })

  void it('should exclude students on the blocklist', () => {
    const blockedStudent = createStudent({ studentNumber: '111111111' })
    const otherStudent = createStudent({ studentNumber: '222222222' })

    assert.strictEqual(filterStudent(blockedStudent, { allowlist: [], blocklist: ['111111111'] }), false)
    assert.strictEqual(filterStudent(otherStudent, { allowlist: [], blocklist: ['111111111'] }), true)
  })

  void it('should include students on the allowlist not on the blocklist', () => {
    const lists = { allowlist: ['111111111', '222222222'], blocklist: ['111111111'] }

    const blockedStudent = createStudent({ studentNumber: '111111111' })
    const allowedStudent = createStudent({ studentNumber: '222222222' })

    assert.strictEqual(filterStudent(blockedStudent, lists), false)
    assert.strictEqual(filterStudent(allowedStudent, lists), true)
  })

  void it('isActive should match the filter state', () => {
    assert.strictEqual(studentNumberFilter().isActive({ allowlist: [], blocklist: [] }, undefined), false)
    assert.strictEqual(studentNumberFilter().isActive({ allowlist: ['111111111'], blocklist: [] }, undefined), true)
    assert.strictEqual(studentNumberFilter().isActive({ allowlist: [], blocklist: ['111111111'] }, undefined), true)
    assert.strictEqual(
      studentNumberFilter().isActive({ allowlist: ['111111111'], blocklist: ['111111111'] }, undefined),
      true
    )
  })
})
