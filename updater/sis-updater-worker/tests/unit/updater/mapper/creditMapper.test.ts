import { describe, expect, it, vi } from 'vitest'

import './initTests'

import { creditMapper } from '@/updater/mapper'
import { getCreditTypeCodeFromAttainment, getGrade, getSemesterByDate, getUniOrgId } from '@/updater/shared'

describe('creditMapper', () => {
  const baseAttainment = {
    id: 'att1',
    credits: 5,
    person_id: 'p1',
    registration_date: '2020-01-10',
    grade_scale_id: 'scale1',
    grade_id: 'grade1',
    organisations: [{ organisationId: 'org1', roleUrn: 'urn:code:organisation-role:responsible-organisation' }],
    attainment_date: '2020-01-15',
    type: 'CourseUnitAttainment',
    course_unit_id: 'cu1',
    module_id: null,
    module_group_id: null,
    study_right_id: null,
    attainment_language_urn: 'urn:code:language:fi',
  }

  const lookupMaps = (overrides = {}) => ({
    personIdToStudentNumber: { p1: '014123456' },
    courseUnitIdToCourseCode: { cu1: 'TKT10' },
    moduleGroupIdToModuleCode: {},
    studyRightIdToEducationType: {},
    ...overrides,
  })

  const mapCredit = maps =>
    creditMapper(
      maps.personIdToStudentNumber,
      maps.courseUnitIdToCourseCode,
      maps.moduleGroupIdToModuleCode,
      maps.studyRightIdToEducationType
    )

  it('maps attainment correctly into credit', () => {
    vi.mocked(getUniOrgId).mockReturnValue('uni-org1')
    vi.mocked(getSemesterByDate).mockReturnValue({ semestercode: 100, composite: '2020-2021-fall' })
    vi.mocked(getGrade).mockReturnValue({ value: '5', passed: true })
    vi.mocked(getCreditTypeCodeFromAttainment).mockReturnValue('PASSED' as any)

    const result = mapCredit(lookupMaps())(baseAttainment)

    expect(result).toEqual({
      id: 'att1',
      grade: '5',
      student_studentnumber: '014123456',
      credits: 5,
      createdate: '2020-01-10',
      credittypecode: 'PASSED',
      attainment_date: '2020-01-15',
      course_id: 'cu1',
      course_code: 'TKT10',
      semestercode: 100,
      semester_composite: '2020-2021-fall',
      isStudyModule: false,
      org: 'uni-org1',
      language: 'fi',
      is_open: false,
      studyright_id: null,
    })
  })

  it('returns null when there is no target semester for the attainment date', () => {
    vi.mocked(getUniOrgId).mockReturnValue('uni-org1')
    vi.mocked(getSemesterByDate).mockReturnValue(undefined)

    expect(mapCredit(lookupMaps())(baseAttainment)).toBeNull()
  })

  it('returns null when the course code cannot be resolved', () => {
    vi.mocked(getUniOrgId).mockReturnValue('uni-org1')
    vi.mocked(getSemesterByDate).mockReturnValue({ semestercode: 100, composite: '2020-2021-fall' })

    const result = mapCredit(lookupMaps({ courseUnitIdToCourseCode: {} }))(baseAttainment)

    expect(result).toBeNull()
  })

  it('marks open university attainments via the AY course code prefix', () => {
    vi.mocked(getUniOrgId).mockReturnValue('uni-org1')
    vi.mocked(getSemesterByDate).mockReturnValue({ semestercode: 100, composite: '2020-2021-fall' })
    vi.mocked(getGrade).mockReturnValue({ value: '5', passed: true })
    vi.mocked(getCreditTypeCodeFromAttainment).mockReturnValue('PASSED' as any)

    const result = mapCredit(lookupMaps({ courseUnitIdToCourseCode: { cu1: 'AY123' } }))(baseAttainment)

    expect(result!.is_open).toBe(true)
  })

  it('marks open university attainments via the study right education type', () => {
    vi.mocked(getUniOrgId).mockReturnValue('uni-org1')
    vi.mocked(getSemesterByDate).mockReturnValue({ semestercode: 100, composite: '2020-2021-fall' })
    vi.mocked(getGrade).mockReturnValue({ value: '5', passed: true })
    vi.mocked(getCreditTypeCodeFromAttainment).mockReturnValue('PASSED' as any)

    const attainment = { ...baseAttainment, study_right_id: 'sr1' }
    const result = mapCredit(
      lookupMaps({
        studyRightIdToEducationType: { sr1: 'urn:code:education-type:non-degree-education:open-university-studies' },
      })
    )(attainment)

    expect(result!.is_open).toBe(true)
  })

  it('returns null with missing organization', () => {
    const attainment = { ...baseAttainment, organisations: undefined }

    expect(mapCredit(lookupMaps())(attainment)).toBeNull()
  })
})
