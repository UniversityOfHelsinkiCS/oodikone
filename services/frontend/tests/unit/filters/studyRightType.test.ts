import { assert, describe, it } from 'vitest'

import { studyRightTypeFilter } from '@/components/FilterView/filters/studyRightType'
import { ExtentCode } from '@oodikone/shared/types'
import { StudentStudyRight } from '@oodikone/shared/types/studentData'

import {
  createStudent,
  createStudyRight as createBaseStudyRight,
  createStudyRightElement,
} from '@oodikone/shared/test/utils'

const createStudyRight = (overrides: Partial<StudentStudyRight> = {}): StudentStudyRight =>
  createBaseStudyRight({ studyRightElements: [createStudyRightElement({ code: 'KH50' })], ...overrides })

const ARGS = { programme: 'KH50' }

enum StudyRightMode {
  ALL = '0',
  BACHELOR_AND_MASTER = '1',
  MASTER = '2',
}

void describe('studyRightTypeFilter', () => {
  void it('should include all students when mode is All', () => {
    const student = createStudent({ studyRights: [createStudyRight({ extentCode: ExtentCode.MASTER })] })

    const result = studyRightTypeFilter().filter(student, {
      args: ARGS,
      options: { mode: StudyRightMode.ALL },
      precomputed: undefined,
    })

    assert.strictEqual(result, true)
  })

  void it('should exclude student when the student has no matching study right', () => {
    const student = createStudent({ studyRights: [] })

    const result = studyRightTypeFilter().filter(student, {
      args: ARGS,
      options: { mode: StudyRightMode.BACHELOR_AND_MASTER },
      precomputed: undefined,
    })

    assert.strictEqual(result, false)
  })

  void it('should include student with Bachelor + master study right when the filter state is bachelor + master', () => {
    const student = createStudent({
      studyRights: [createStudyRight({ extentCode: ExtentCode.BACHELOR_AND_MASTER })],
    })

    const result = studyRightTypeFilter().filter(student, {
      args: ARGS,
      options: { mode: '1' },
      precomputed: undefined,
    })

    assert.strictEqual(result, true)
  })

  void it('should include student with Master study right when the filter state is master only', () => {
    const student = createStudent({ studyRights: [createStudyRight({ extentCode: ExtentCode.MASTER })] })

    const result = studyRightTypeFilter().filter(student, {
      args: ARGS,
      options: { mode: StudyRightMode.MASTER },
      precomputed: undefined,
    })

    assert.strictEqual(result, true)
  })

  void it('should exclude student with only Bachelor + master study right when the study right is master only', () => {
    const student = createStudent({ studyRights: [createStudyRight({ extentCode: ExtentCode.BACHELOR_AND_MASTER })] })

    const result = studyRightTypeFilter().filter(student, {
      args: ARGS,
      options: { mode: StudyRightMode.MASTER },
      precomputed: undefined,
    })

    assert.strictEqual(result, false)
  })

  void it('isActive should match the filter state', () => {
    assert.strictEqual(studyRightTypeFilter().isActive({ mode: StudyRightMode.ALL }, undefined), false)
    assert.strictEqual(studyRightTypeFilter().isActive({ mode: StudyRightMode.BACHELOR_AND_MASTER }, undefined), true)
    assert.strictEqual(studyRightTypeFilter().isActive({ mode: StudyRightMode.MASTER }, undefined), true)
  })
})
