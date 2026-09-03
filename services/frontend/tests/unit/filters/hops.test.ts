import { assert, describe, it } from 'vitest'

import { hopsFilter } from '@/components/FilterView/filters/hops'
import { DegreeProgrammeType, Phase } from '@oodikone/shared/types'
import { FormattedStudent, StudentStudyPlan } from '@oodikone/shared/types/studentData'

import { createCourse, createStudent, createStudyRight } from '@oodikone/shared/test/utils'

const createHops = (programmeCode: string, sisStudyRightId: string, includedCourses: string[]): StudentStudyPlan => ({
  included_courses: includedCourses,
  programme_code: programmeCode,
  includedModules: [],
  completed_credits: 0,
  curriculum_period_id: 'cp-1',
  sis_study_right_id: sisStudyRightId,
})

const ARGS = { programmeCode: 'KH50', combinedProgrammeCode: 'MH50' }

const mutate = (student: FormattedStudent, options: { activeProgramme?: boolean; activeCombinedProgramme?: boolean }) =>
  hopsFilter(ARGS).mutate!(student, {
    args: ARGS,
    options: { activeProgramme: false, activeCombinedProgramme: false, combinedIsSelected: 'default', ...options },
    precomputed: undefined,
  })

void describe('hopsFilter', () => {
  void it("should include student's HOPS credits if study right is cancelled when graduating", () => {
    const student = createStudent({
      studyRights: [
        createStudyRight({
          id: 'sr-1',
          cancelled: true,
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
      studyplans: [createHops('KH50', 'sr-1', ['MAT001'])],
      courses: [createCourse({ course_id: 'MAT001' }), createCourse({ course_id: 'TKT002' })],
    })

    const result = mutate(student, { activeProgramme: true })

    assert.deepStrictEqual(
      result.courses.map(({ course_id }) => course_id),
      ['MAT001']
    )
  })

  void it("should exclude student's HOPS credits if study right is cancelled but not graduated", () => {
    const student = createStudent({
      studyRights: [createStudyRight({ id: 'sr-1', cancelled: true })],
      studyplans: [createHops('KH50', 'sr-1', ['MAT001'])],
      courses: [createCourse({ course_id: 'MAT001' }), createCourse({ course_id: 'TKT002' })],
    })

    const result = mutate(student, { activeProgramme: true })

    assert.deepStrictEqual(result.courses, [])
  })

  void it("should include student's HOPS credits if study right not cancelled nor graduated", () => {
    const student = createStudent({
      studyRights: [createStudyRight({ id: 'sr-1', cancelled: false })],
      studyplans: [createHops('KH50', 'sr-1', ['MAT001'])],
      courses: [createCourse({ course_id: 'MAT001' }), createCourse({ course_id: 'TKT002' })],
    })

    const result = mutate(student, { activeProgramme: true })

    assert.deepStrictEqual(
      result.courses.map(({ course_id }) => course_id),
      ['MAT001']
    )
  })

  void it("should keep only the normal programme's HOPS credits when only normal programme toggle is active", () => {
    const student = createStudent({
      studyRights: [createStudyRight({ id: 'sr-1', cancelled: false })],
      studyplans: [createHops('KH50', 'sr-1', ['MAT001']), createHops('MH50', 'sr-1', ['TKT002'])],
      courses: [createCourse({ course_id: 'MAT001' }), createCourse({ course_id: 'TKT002' })],
    })

    const result = mutate(student, { activeProgramme: true })

    assert.deepStrictEqual(
      result.courses.map(({ course_id }) => course_id),
      ['MAT001']
    )
  })

  void it("should keep only the combined programme's HOPS credits when only combined programme toggle is active", () => {
    const student = createStudent({
      studyRights: [createStudyRight({ id: 'sr-1', cancelled: false })],
      studyplans: [createHops('KH50', 'sr-1', ['MAT001']), createHops('MH50', 'sr-1', ['TKT002'])],
      courses: [createCourse({ course_id: 'MAT001' }), createCourse({ course_id: 'TKT002' })],
    })

    const result = mutate(student, { activeCombinedProgramme: true })

    assert.deepStrictEqual(
      result.courses.map(({ course_id }) => course_id),
      ['TKT002']
    )
  })

  void it('should not do anything if filters are not active', () => {
    const student = createStudent({
      studyRights: [createStudyRight({ id: 'sr-1', cancelled: false })],
      studyplans: [createHops('KH50', 'sr-1', ['MAT001'])],
      courses: [createCourse({ course_id: 'MAT001' }), createCourse({ course_id: 'TKT002' })],
    })

    const result = mutate(student, {})

    assert.deepStrictEqual(result.courses, student.courses)
  })
  void it('sholud return true if filters are not active', () => {
    const student = createStudent()

    assert.strictEqual(
      hopsFilter(ARGS).filter(student, {
        args: ARGS,
        options: { activeProgramme: false, activeCombinedProgramme: false, combinedIsSelected: 'default' },
        precomputed: undefined,
      }),
      true
    )
  })

  void it('should return correct values for isActive corresponding to the filter state', () => {
    assert.strictEqual(
      hopsFilter(ARGS).isActive(
        { activeProgramme: true, activeCombinedProgramme: false, combinedIsSelected: 'default' },
        undefined
      ),
      true
    )
    assert.strictEqual(
      hopsFilter(ARGS).isActive(
        { activeProgramme: false, activeCombinedProgramme: true, combinedIsSelected: 'default' },
        undefined
      ),
      true
    )
    assert.strictEqual(
      hopsFilter(ARGS).isActive(
        { activeProgramme: true, activeCombinedProgramme: true, combinedIsSelected: 'default' },
        undefined
      ),
      true
    )
    assert.strictEqual(
      hopsFilter(ARGS).isActive(
        { activeProgramme: false, activeCombinedProgramme: false, combinedIsSelected: 'default' },
        undefined
      ),
      false
    )
  })
})
