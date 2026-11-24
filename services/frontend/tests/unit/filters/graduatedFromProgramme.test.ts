import { assert, describe, it } from 'vitest'

import {
  graduatedFromProgrammeFilter,
  GRADUATION_PHASE,
  GraduationPhase,
} from '@/components/FilterView/filters/graduatedFromProgramme'
import { DegreeProgrammeType } from '@oodikone/shared/types'
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

void describe('graduatedFromProgrammeFilter with bachelor and master', () => {
  const BA_MA_ARGS = { code: 'KH50_001', showBachelorAndMaster: true }

  const filterBaMa = (student: FormattedStudent, mode: GraduationPhase) =>
    graduatedFromProgrammeFilter(BA_MA_ARGS).filter(student, {
      args: BA_MA_ARGS,
      options: { mode },
      precomputed: undefined,
    })

  const createBaMaStudent = (bachelorGraduated: boolean, masterGraduated: boolean) =>
    createStudent({
      studyRights: [
        createStudyRight({
          studyRightElements: [
            createElement({ degreeProgrammeType: DegreeProgrammeType.BACHELOR, graduated: bachelorGraduated }),
            createElement({
              code: 'MH50_001',
              degreeProgrammeType: DegreeProgrammeType.MASTER,
              graduated: masterGraduated,
            }),
          ],
        }),
      ],
    })

  void it('should judge bachelor modes by the bachelor element of the study right', () => {
    const student = createBaMaStudent(true, false)

    assert.strictEqual(filterBaMa(student, GRADUATION_PHASE.GRADUATED_BACHELOR), true)
    assert.strictEqual(filterBaMa(student, GRADUATION_PHASE.NOT_GRADUATED_BACHELOR), false)
  })

  void it('should judge master modes by the master element of the study right', () => {
    const onlyBachelor = createBaMaStudent(true, false)
    const both = createBaMaStudent(true, true)

    assert.strictEqual(filterBaMa(onlyBachelor, GRADUATION_PHASE.GRADUATED_MASTER), false)
    assert.strictEqual(filterBaMa(onlyBachelor, GRADUATION_PHASE.NOT_GRADUATED_MASTER), true)
    assert.strictEqual(filterBaMa(both, GRADUATION_PHASE.GRADUATED_MASTER), true)
    assert.strictEqual(filterBaMa(both, GRADUATION_PHASE.NOT_GRADUATED_MASTER), false)
  })
})
