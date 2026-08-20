import { assert, describe, it } from 'vitest'

import { studyRightStatusFilter } from '@/components/FilterView/filters/studyRightStatus'
import { DegreeProgrammeType, EnrollmentType, Phase } from '@oodikone/shared/types'
import { StudentStudyRight } from '@oodikone/shared/types/studentData'

import { createStudent, createStudyRight as createBaseStudyRight } from './helpers'

const createStudyRight = (overrides: Partial<StudentStudyRight> = {}): StudentStudyRight =>
  createBaseStudyRight({ semesterEnrollments: [{ type: EnrollmentType.PRESENT, semester: 1 }], ...overrides })

const ARGS = { code: 'KH50_001', currentSemester: { semestercode: 1 }, showBachelorAndMaster: false }

void describe('studyRightStatusFilter', () => {
  void it('should include all students when there is no current semester', () => {
    const student = createStudent()

    const result = studyRightStatusFilter().filter(student, {
      args: { ...ARGS, currentSemester: undefined },
      options: { activeProgramme: true, activeCombinedProgramme: null },
      precomputed: undefined,
    })

    assert.strictEqual(result, true)
  })

  void it('should exclude a student when the student has no matching study right', () => {
    const student = createStudent({ studyRights: [] })

    const result = studyRightStatusFilter().filter(student, {
      args: ARGS,
      options: { activeProgramme: true, activeCombinedProgramme: null },
      precomputed: undefined,
    })

    assert.strictEqual(result, false)
  })

  void it('should include a student with an active study right filtering by active study right', () => {
    const student = createStudent({ studyRights: [createStudyRight()] })

    const result = studyRightStatusFilter().filter(student, {
      args: ARGS,
      options: { activeProgramme: true, activeCombinedProgramme: null },
      precomputed: undefined,
    })

    assert.strictEqual(result, true)
  })

  void it('should include student with a graduated study right from a different programme and active from the current', () => {
    const student = createStudent({
      studyRights: [
        createStudyRight({
          studyRightElements: [
            {
              code: 'KH50_001',
              name: { fi: 'Testiohjelma' },
              studyTrack: null,
              graduated: false,
              startDate: new Date('2024-08-01'),
              endDate: new Date('2025-08-01'),
              phase: Phase.ANY,
              degreeProgrammeType: DegreeProgrammeType.BACHELOR,
            },
            {
              code: 'KH50_002',
              name: { fi: 'Testiohjelma' },
              studyTrack: null,
              graduated: true,
              startDate: new Date('2020-08-01'),
              endDate: new Date('2024-08-01'),
              phase: Phase.ANY,
              degreeProgrammeType: DegreeProgrammeType.BACHELOR,
            },
          ],
        }),
      ],
    })

    const result = studyRightStatusFilter().filter(student, {
      args: ARGS,
      options: { activeProgramme: true, activeCombinedProgramme: null },
      precomputed: undefined,
    })

    assert.strictEqual(result, true)
  })

  void it('should exclude student with a graduated study right from the current programme regardless of filter state', () => {
    const student = createStudent({
      studyRights: [
        createStudyRight({
          studyRightElements: [
            {
              code: 'KH50_001',
              name: { fi: 'Testiohjelma' },
              studyTrack: null,
              graduated: true,
              startDate: new Date('2020-08-01'),
              endDate: new Date('2024-08-01'),
              phase: Phase.ANY,
              degreeProgrammeType: DegreeProgrammeType.BACHELOR,
            },
          ],
        }),
      ],
    })

    const result = studyRightStatusFilter().filter(student, {
      args: ARGS,
      options: { activeProgramme: true, activeCombinedProgramme: null },
      precomputed: undefined,
    })

    assert.strictEqual(result, false)
  })

  void it('isActive should match the filter state', () => {
    assert.strictEqual(
      studyRightStatusFilter().isActive({ activeProgramme: null, activeCombinedProgramme: null }, undefined),
      false
    )
    assert.strictEqual(
      studyRightStatusFilter().isActive({ activeProgramme: true, activeCombinedProgramme: null }, undefined),
      true
    )
    assert.strictEqual(
      studyRightStatusFilter().isActive({ activeProgramme: null, activeCombinedProgramme: false }, undefined),
      true
    )
    assert.strictEqual(
      studyRightStatusFilter().isActive({ activeProgramme: true, activeCombinedProgramme: false }, undefined),
      true
    )
  })
})
