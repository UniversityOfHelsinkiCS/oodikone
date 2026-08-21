import { assert, describe, it } from 'vitest'

import {
  graduatedFromProgrammeFilter,
  GRADUATION_PHASE,
  GraduationPhase,
} from '@/components/FilterView/filters/graduatedFromProgramme'
import { FormattedStudent, StudentStudyRight, StudentStudyRightElement } from '@oodikone/shared/types/studentData'

import {
  createStudent,
  createStudyRight as createBaseStudyRight,
  createStudyRightElement,
} from '@oodikone/shared/test/utils'

const createElement = (overrides: Partial<StudentStudyRightElement> = {}): StudentStudyRightElement =>
  createStudyRightElement({ code: 'KH50_001', endDate: new Date('2024-08-01'), ...overrides })

const createStudyRight = (overrides: Partial<StudentStudyRight> = {}): StudentStudyRight =>
  createBaseStudyRight({ studyRightElements: [createElement()], ...overrides })

const ARGS = { code: 'KH50_001', showBachelorAndMaster: false }

const filterStudent = (student: FormattedStudent, mode: GraduationPhase) =>
  graduatedFromProgrammeFilter(ARGS).filter(student, { args: ARGS, options: { mode }, precomputed: undefined })

void describe('graduatedFromProgrammeFilter', () => {
  void it('should exclude student who has no study right for the given programme', () => {
    const student = createStudent({ studyRights: [] })

    assert.strictEqual(filterStudent(student, GRADUATION_PHASE.GRADUATED), false)
  })

  void it('should include student when mode is Graduated and student has graduated from the programme', () => {
    const student = createStudent({
      studyRights: [createStudyRight({ studyRightElements: [createElement({ graduated: true })] })],
    })

    assert.strictEqual(filterStudent(student, GRADUATION_PHASE.GRADUATED), true)
  })

  void it('should exclude student when mode is Graduated and student has not graduated', () => {
    const student = createStudent({
      studyRights: [createStudyRight({ studyRightElements: [createElement({ graduated: false })] })],
    })

    assert.strictEqual(filterStudent(student, GRADUATION_PHASE.GRADUATED), false)
  })

  void it('should include student when mode is Not graduated and student has not graduated', () => {
    const student = createStudent({
      studyRights: [createStudyRight({ studyRightElements: [createElement({ graduated: false })] })],
    })

    assert.strictEqual(filterStudent(student, GRADUATION_PHASE.NOT_GRADUATED), true)
  })

  void it('isActive should match the filter state', () => {
    assert.strictEqual(graduatedFromProgrammeFilter(ARGS).isActive({ mode: '0' }, undefined), false)
    assert.strictEqual(
      graduatedFromProgrammeFilter(ARGS).isActive({ mode: GRADUATION_PHASE.GRADUATED }, undefined),
      true
    )
    assert.strictEqual(
      graduatedFromProgrammeFilter(ARGS).isActive({ mode: GRADUATION_PHASE.NOT_GRADUATED }, undefined),
      true
    )
  })
})
