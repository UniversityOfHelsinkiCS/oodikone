import { assert, describe, it } from 'vitest'

import { DegreeProgrammeType, EnrollmentType, Phase } from '@oodikone/shared/types'
import { FormattedStudent, StudentStudyRight } from '@oodikone/shared/types/studentData'

import { createStudent, createStudyRight as createBaseStudyRight } from '@oodikone/shared/test/utils'

const { enrollmentStatusFilter } = await import('@/components/FilterView/filters/enrollmentStatus')

const createStudyRight = (overrides: Partial<StudentStudyRight> = {}): StudentStudyRight =>
  createBaseStudyRight({ studyRightElements: [], ...overrides })

const filterStudent = (
  student: FormattedStudent,
  options: { status: EnrollmentType | ''; semesters: number[] },
  args: { programme?: string } = {}
) => enrollmentStatusFilter().filter(student, { args, options, precomputed: undefined })

void describe('enrollmentStatusFilter', () => {
  void it('should pass a student enrolled with the chosen status for all chosen semesters', () => {
    const student = createStudent({
      studyRights: [createStudyRight({ semesterEnrollments: [{ type: EnrollmentType.PRESENT, semester: 1 }] })],
    })

    assert.strictEqual(filterStudent(student, { status: EnrollmentType.PRESENT, semesters: [1] }), true)
  })

  void it('should not pass a student enrolled with a different status', () => {
    const student = createStudent({
      studyRights: [createStudyRight({ semesterEnrollments: [{ type: EnrollmentType.ABSENT, semester: 1 }] })],
    })

    assert.strictEqual(filterStudent(student, { status: EnrollmentType.PRESENT, semesters: [1] }), false)
  })

  void it('should only look at the study right matching the given programme when args.programme is set', () => {
    const student = createStudent({
      studyRights: [
        createStudyRight({
          id: 'sr-1',
          semesterEnrollments: [{ type: EnrollmentType.PRESENT, semester: 1 }],
          studyRightElements: [
            {
              code: 'KH50_001',
              name: { fi: 'Muu ohjelma' },
              studyTrack: null,
              graduated: false,
              startDate: new Date('2020-08-01'),
              endDate: new Date('2025-08-01'),
              phase: Phase.ANY,
              degreeProgrammeType: DegreeProgrammeType.BACHELOR,
            },
          ],
        }),
        createStudyRight({
          id: 'sr-2',
          semesterEnrollments: [{ type: EnrollmentType.ABSENT, semester: 1 }],
          studyRightElements: [
            {
              code: 'KH50_002',
              name: { fi: 'Testiohjelma' },
              studyTrack: null,
              graduated: false,
              startDate: new Date('2020-08-01'),
              endDate: new Date('2025-08-01'),
              phase: Phase.ANY,
              degreeProgrammeType: DegreeProgrammeType.BACHELOR,
            },
          ],
        }),
      ],
    })

    // KH50_001
    assert.strictEqual(
      filterStudent(student, { status: EnrollmentType.PRESENT, semesters: [1] }, { programme: 'KH50_001' }),
      true
    )
    assert.strictEqual(
      filterStudent(student, { status: EnrollmentType.ABSENT, semesters: [1] }, { programme: 'KH50_001' }),
      false
    )

    // KH50_002
    assert.strictEqual(
      filterStudent(student, { status: EnrollmentType.ABSENT, semesters: [1] }, { programme: 'KH50_002' }),
      true
    )
    assert.strictEqual(
      filterStudent(student, { status: EnrollmentType.PRESENT, semesters: [1] }, { programme: 'KH50_002' }),
      false
    )
  })

  void it('isActive should match the filter state', () => {
    assert.strictEqual(enrollmentStatusFilter().isActive({ status: '', semesters: [] }, undefined), false)
    // Only semester selected doesn't filter anything
    assert.strictEqual(enrollmentStatusFilter().isActive({ status: null, semesters: [1] }, undefined), false)
    assert.strictEqual(
      enrollmentStatusFilter().isActive({ status: EnrollmentType.PRESENT, semesters: [] }, undefined),
      true
    )
  })
})
