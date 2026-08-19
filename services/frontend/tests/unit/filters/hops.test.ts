import { assert, describe, it } from 'vitest'

import { hopsFilter } from '@/components/FilterView/filters/hops'
import { CreditTypeCode, DegreeProgrammeType, ExtentCode, Phase } from '@oodikone/shared/types'
import {
  FormattedStudent,
  StudentCourse,
  StudentStudyPlan,
  StudentStudyRight,
} from '@oodikone/shared/types/studentData'

const createStudyRight = (overrides: Partial<StudentStudyRight> = {}): StudentStudyRight => ({
  id: 'sr-1',
  extentCode: ExtentCode.BACHELOR,
  facultyCode: 'H50',
  admissionType: 'regular',
  cancelled: false,
  semesterEnrollments: null,
  startDate: new Date('2020-08-01'),
  tvex: false,
  studyRightElements: [
    {
      code: 'KH50_001',
      name: { fi: 'Testiohjelma' },
      studyTrack: null,
      graduated: false,
      startDate: new Date('2020-08-01'),
      endDate: new Date('2025-08-01'),
      phase: Phase.ANY,
      degreeProgrammeType: DegreeProgrammeType.BACHELOR,
    },
  ],
  ...overrides,
})

const createHops = (programmeCode: string, sisStudyRightId: string, includedCourses: string[]): StudentStudyPlan => ({
  included_courses: includedCourses,
  programme_code: programmeCode,
  includedModules: [],
  completed_credits: 0,
  curriculum_period_id: 'cp-1',
  sis_study_right_id: sisStudyRightId,
})

const createCourse = (course_code: string): StudentCourse => ({
  course_code,
  date: new Date('2024-09-01'),
  passed: true,
  grade: '5',
  credits: 5,
  isStudyModuleCredit: false,
  credittypecode: CreditTypeCode.PASSED,
  language: 'fi',
  studyright_id: 'sr-1',
})

const createStudent = (overrides: Partial<FormattedStudent> = {}): FormattedStudent => ({
  firstnames: 'Testi',
  lastname: 'Opiskelija',
  started: new Date('2024-08-01'),
  studentNumber: '123456789',
  credits: 0,
  hopsCredits: 0,
  name: 'Testi Opiskelija',
  gender_code: '1',
  email: 'testi@example.com',
  secondaryEmail: '',
  phoneNumber: '',
  updatedAt: new Date(),
  tags: [],
  studyrightStart: '2024-08-01',
  option: null,
  birthdate: new Date('2002-03-06'),
  sis_person_id: '1',
  citizenships: [],
  criteriaProgress: {},
  curriculumVersion: null,
  hasPersonalIdentityCode: false,
  transferredStudyright: false,
  transferSource: undefined,
  studyRights: [],
  studyplans: [],
  courses: [],
  enrollments: [],
  ...overrides,
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
      studyplans: [createHops('KH50', 'sr-1', ['MAT1'])],
      courses: [createCourse('MAT1'), createCourse('TKT2')],
    })

    const result = mutate(student, { activeProgramme: true })

    assert.deepStrictEqual(
      result.courses.map(({ course_code }) => course_code),
      ['MAT1']
    )
  })

  void it("should exclude student's HOPS credits if study right is cancelled but not graduated", () => {
    const student = createStudent({
      studyRights: [createStudyRight({ id: 'sr-1', cancelled: true })],
      studyplans: [createHops('KH50', 'sr-1', ['MAT1'])],
      courses: [createCourse('MAT1'), createCourse('TKT2')],
    })

    const result = mutate(student, { activeProgramme: true })

    assert.deepStrictEqual(result.courses, [])
  })

  void it("should include student's HOPS credits if study right not cancelled nor graduated", () => {
    const student = createStudent({
      studyRights: [createStudyRight({ id: 'sr-1', cancelled: false })],
      studyplans: [createHops('KH50', 'sr-1', ['MAT1'])],
      courses: [createCourse('MAT1'), createCourse('TKT2')],
    })

    const result = mutate(student, { activeProgramme: true })

    assert.deepStrictEqual(
      result.courses.map(({ course_code }) => course_code),
      ['MAT1']
    )
  })

  void it("should keep only the normal programme's HOPS credits when only normal programme toggle is active", () => {
    const student = createStudent({
      studyRights: [createStudyRight({ id: 'sr-1', cancelled: false })],
      studyplans: [createHops('KH50', 'sr-1', ['MAT1']), createHops('MH50', 'sr-1', ['TKT2'])],
      courses: [createCourse('MAT1'), createCourse('TKT2')],
    })

    const result = mutate(student, { activeProgramme: true })

    assert.deepStrictEqual(
      result.courses.map(({ course_code }) => course_code),
      ['MAT1']
    )
  })

  void it("should keep only the combined programme's HOPS credits when only combined programme toggle is active", () => {
    const student = createStudent({
      studyRights: [createStudyRight({ id: 'sr-1', cancelled: false })],
      studyplans: [createHops('KH50', 'sr-1', ['MAT1']), createHops('MH50', 'sr-1', ['TKT2'])],
      courses: [createCourse('MAT1'), createCourse('TKT2')],
    })

    const result = mutate(student, { activeCombinedProgramme: true })

    assert.deepStrictEqual(
      result.courses.map(({ course_code }) => course_code),
      ['TKT2']
    )
  })

  void it('should not do anything if filters are not active', () => {
    const student = createStudent({
      studyRights: [createStudyRight({ id: 'sr-1', cancelled: false })],
      studyplans: [createHops('KH50', 'sr-1', ['MAT1'])],
      courses: [createCourse('MAT1'), createCourse('TKT2')],
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
