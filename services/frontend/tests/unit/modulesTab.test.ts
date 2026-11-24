import { assert, describe, it } from 'vitest'

import { getStudyplanModules } from '@/components/PopulationComponents/Students/Table/ModulesTab/util'
import { CreditTypeCode } from '@oodikone/shared/types'
import { StudentStudyplanCourse } from '@oodikone/shared/types/studentData'

import {
  createCourse,
  createStudent,
  createStudyPlan,
  createStudyRight,
  createStudyRightElement,
} from '@oodikone/shared/test/utils'

const PROGRAMME = 'KH50_001'
const curriculumModuleCodeByGroupId = new Map([
  ['hy-SM-1', 'MAT110'],
  ['hy-SM-2', 'MAT120'],
])

const studyModule = (groupId: string): StudentStudyplanCourse => ({ groupId, isStudyModule: true })

const createStudentWithModules = (courses: StudentStudyplanCourse[], overrides = {}) =>
  createStudent({
    studyRights: [createStudyRight({ id: 'sr-1', studyRightElements: [createStudyRightElement({ code: PROGRAMME })] })],
    studyplans: [createStudyPlan({ programme_code: PROGRAMME, sis_study_right_id: 'sr-1', courses })],
    ...overrides,
  })

void describe('getStudyplanModules', () => {
  void it('maps studyplan modules to curriculum module codes by group id', () => {
    const student = createStudentWithModules([studyModule('hy-SM-1'), studyModule('hy-SM-2')])

    assert.deepEqual(getStudyplanModules(student, [PROGRAMME], curriculumModuleCodeByGroupId), [
      { code: 'MAT110', completed: false, completionDate: null },
      { code: 'MAT120', completed: false, completionDate: null },
    ])
  })

  void it('marks a module completed when the student has passed a credit for its group', () => {
    const student = createStudentWithModules([studyModule('hy-SM-1')], {
      courses: [createCourse({ courseGroupId: 'hy-SM-1', passed: true, date: new Date('2023-05-31') })],
    })

    assert.deepEqual(getStudyplanModules(student, [PROGRAMME], curriculumModuleCodeByGroupId), [
      { code: 'MAT110', completed: true, completionDate: '31-05-2023' },
    ])
  })

  void it('does not mark a module completed by a failed credit', () => {
    const student = createStudentWithModules([studyModule('hy-SM-1')], {
      courses: [createCourse({ courseGroupId: 'hy-SM-1', passed: false, credittypecode: CreditTypeCode.FAILED })],
    })

    assert.deepEqual(getStudyplanModules(student, [PROGRAMME], curriculumModuleCodeByGroupId), [
      { code: 'MAT110', completed: false, completionDate: null },
    ])
  })

  void it('ignores plain courses and modules outside the curriculum', () => {
    const student = createStudentWithModules([
      { groupId: 'hy-SM-1', isStudyModule: false },
      studyModule('hy-SM-other'),
      studyModule('hy-SM-2'),
    ])

    assert.deepEqual(getStudyplanModules(student, [PROGRAMME], curriculumModuleCodeByGroupId), [
      { code: 'MAT120', completed: false, completionDate: null },
    ])
  })

  void it('uses the studyplan of the study right containing the programme', () => {
    const student = createStudent({
      studyRights: [
        createStudyRight({ id: 'sr-other', studyRightElements: [createStudyRightElement({ code: 'KH40_001' })] }),
        createStudyRight({ id: 'sr-1', studyRightElements: [createStudyRightElement({ code: PROGRAMME })] }),
      ],
      studyplans: [
        createStudyPlan({
          programme_code: PROGRAMME,
          sis_study_right_id: 'sr-other',
          courses: [studyModule('hy-SM-1')],
        }),
        createStudyPlan({ programme_code: PROGRAMME, sis_study_right_id: 'sr-1', courses: [studyModule('hy-SM-2')] }),
      ],
    })

    assert.deepEqual(getStudyplanModules(student, [PROGRAMME], curriculumModuleCodeByGroupId), [
      { code: 'MAT120', completed: false, completionDate: null },
    ])
  })

  void it('returns no modules when no study right contains the programme', () => {
    const student = createStudentWithModules([studyModule('hy-SM-1')])

    assert.deepEqual(getStudyplanModules(student, ['KH40_001'], curriculumModuleCodeByGroupId), [])
  })
})
