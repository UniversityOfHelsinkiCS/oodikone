import { assert, describe, it } from 'vitest'

import { getHiddenCourseCodes, getHiddenModuleCodes } from '@/components/HiddenCourseAlert/util'
import type { ProgrammeCourse } from '@oodikone/shared/types'

const createCourse = (code: string, parentCode: string | null, visibility: boolean) =>
  ({ code, parent_code: parentCode, visible: { id: null, visibility } }) as ProgrammeCourse

void describe('getHiddenCourseCodes', () => {
  void it('returns codes of hidden courses', () => {
    const courses = [createCourse('TKT1', 'MOD1', false), createCourse('TKT2', 'MOD1', true)]

    assert.deepEqual(getHiddenCourseCodes(courses), ['TKT1'])
  })

  void it('returns nothing when all courses are visible', () => {
    const courses = [createCourse('TKT1', 'MOD1', true), createCourse('TKT2', 'MOD2', true)]

    assert.deepEqual(getHiddenCourseCodes(courses), [])
  })

  void it('returns nothing when there are no courses', () => {
    assert.deepEqual(getHiddenCourseCodes([]), [])
  })

  void it('returns hidden courses even if their module still has visible courses', () => {
    const courses = [
      createCourse('TKT1', 'MOD1', false),
      createCourse('TKT2', 'MOD1', true),
      createCourse('TKT3', 'MOD2', false),
      createCourse('TKT4', 'MOD2', false),
    ]

    assert.deepEqual(getHiddenCourseCodes(courses), ['TKT1', 'TKT3', 'TKT4'])
  })

  void it('includes hidden courses without a parent', () => {
    const courses = [createCourse('TKT1', null, false), createCourse('TKT2', null, true)]

    assert.deepEqual(getHiddenCourseCodes(courses), ['TKT1'])
  })

  void it('keeps the original course order', () => {
    const courses = [
      createCourse('TKT3', 'MOD1', false),
      createCourse('TKT1', 'MOD2', false),
      createCourse('TKT2', 'MOD1', false),
    ]

    assert.deepEqual(getHiddenCourseCodes(courses), ['TKT3', 'TKT1', 'TKT2'])
  })
})

void describe('getHiddenModuleCodes', () => {
  void it('returns modules whose courses are all hidden', () => {
    const courses = [
      createCourse('TKT1', 'MOD1', false),
      createCourse('TKT2', 'MOD1', false),
      createCourse('TKT3', 'MOD2', false),
      createCourse('TKT4', 'MOD2', true),
      createCourse('TKT5', 'MOD3', true),
    ]

    assert.deepEqual(getHiddenModuleCodes(courses), ['MOD1'])
  })

  void it('does not hide a module if a visible course comes after hidden ones', () => {
    const courses = [
      createCourse('TKT1', 'MOD1', false),
      createCourse('TKT2', 'MOD1', true),
      createCourse('TKT3', 'MOD1', false),
    ]

    assert.deepEqual(getHiddenModuleCodes(courses), [])
  })

  void it('ignores courses without a parent', () => {
    const courses = [createCourse('TKT1', null, false)]

    assert.deepEqual(getHiddenModuleCodes(courses), [])
  })
})
