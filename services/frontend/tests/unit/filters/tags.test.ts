import { assert, describe, it } from 'vitest'

import { tagsFilter } from '@/components/FilterView/filters/tags'
import type { Tag } from '@oodikone/shared/models/kone'
import { FormattedStudent } from '@oodikone/shared/types/studentData'

import { createStudent, createTag as createBaseTag } from '@oodikone/shared/test/utils'

const createTag = (tagId: string) =>
  createBaseTag({
    tag_id: tagId,
    tag: { tag_id: tagId, tagname: `Tag ${tagId}`, personal_user_id: null } as unknown as Tag,
  })

const filterStudent = (student: FormattedStudent, includedTags: string[], excludedTags: string[]) =>
  tagsFilter().filter(student, { args: undefined, options: { includedTags, excludedTags }, precomputed: undefined })

void describe('tagsFilter', () => {
  void it('should include student when student has one of the included tags', () => {
    const student = createStudent({ tags: [createTag('1')] })

    assert.strictEqual(filterStudent(student, ['1'], []), true)
  })

  void it("should exclude student when student doesn't have any of the included tags", () => {
    const student = createStudent({ tags: [createTag('2')] })

    assert.strictEqual(filterStudent(student, ['1'], []), false)
  })

  void it('should exclude student when student has one of the excluded tags', () => {
    const student = createStudent({ tags: [createTag('1')] })

    assert.strictEqual(filterStudent(student, [], ['1']), false)
  })

  void it('should exclude student when student has tags in both included and excluded tags', () => {
    const student = createStudent({ tags: [createTag('1'), createTag('2')] })

    assert.strictEqual(filterStudent(student, ['1', '2'], ['1']), false)
  })

  void it('should include student when neither included nor excluded tags are set', () => {
    const student = createStudent({ tags: [createTag('1')] })

    assert.strictEqual(filterStudent(student, [], []), true)
  })

  void it('isActive should match the filter state', () => {
    assert.strictEqual(tagsFilter().isActive({ includedTags: [], excludedTags: [] }, undefined), false)
    assert.strictEqual(tagsFilter().isActive({ includedTags: ['1'], excludedTags: [] }, undefined), true)
    assert.strictEqual(tagsFilter().isActive({ includedTags: [], excludedTags: ['1'] }, undefined), true)
  })
})
