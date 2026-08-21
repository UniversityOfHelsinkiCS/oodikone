import type { Credit } from '../../models'
import type { Tag } from '../../models/kone'
import { CreditTypeCode, DegreeProgrammeType, EnrollmentState, ExtentCode, Phase } from '../../types'
import {
  FormattedStudent,
  StudentCourse,
  StudentStudyRight,
  StudentStudyRightElement,
  StudentStudyPlan,
  StudentTags,
} from '../../types/studentData'

export const createStudent = (overrides: Partial<FormattedStudent> = {}): FormattedStudent => ({
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

export const createStudyRightElement = (
  overrides: Partial<StudentStudyRightElement> = {}
): StudentStudyRightElement => ({
  code: 'KH50_001',
  name: { fi: 'Testiohjelma' },
  studyTrack: null,
  graduated: false,
  startDate: new Date('2020-08-01'),
  endDate: new Date('2025-08-01'),
  phase: Phase.ANY,
  degreeProgrammeType: DegreeProgrammeType.BACHELOR,
  ...overrides,
})

export const createStudyRight = (overrides: Partial<StudentStudyRight> = {}): StudentStudyRight => ({
  id: 'sr-1',
  extentCode: ExtentCode.BACHELOR,
  facultyCode: 'H50',
  admissionType: 'regular',
  cancelled: false,
  semesterEnrollments: null,
  startDate: new Date('2020-08-01'),
  tvex: false,
  studyRightElements: [createStudyRightElement()],
  ...overrides,
})

export const createCourse = (overrides: Partial<StudentCourse> = {}): StudentCourse => ({
  course_code: 'MAT001',
  date: new Date('2024-09-01'),
  passed: true,
  grade: '5',
  credits: 5,
  isStudyModuleCredit: false,
  credittypecode: CreditTypeCode.PASSED,
  language: 'fi',
  studyright_id: 'sr-1',
  ...overrides,
})

export const createStudyPlan = (overrides: Partial<StudentStudyPlan> = {}): StudentStudyPlan => ({
  included_courses: [],
  programme_code: 'TEST',
  includedModules: [],
  completed_credits: 0,
  curriculum_period_id: 'cp-1',
  sis_study_right_id: 'sr-1',
  ...overrides,
})

export const createEnrollment = (
  overrides: Partial<FormattedStudent['enrollments'][number]> = {}
): FormattedStudent['enrollments'][number] => ({
  course_code: 'MAT001',
  state: EnrollmentState.ENROLLED,
  enrollment_date_time: new Date('2024-09-01'),
  semestercode: 149,
  studyright_id: 'sr-1',
  ...overrides,
})

export const createTag = (overrides: Partial<StudentTags> = {}): StudentTags => ({
  tag_id: '1',
  studentnumber: '123456789',
  tag: { tag_id: '1', tagname: 'Tag 1', personal_user_id: null } as unknown as Tag,
  ...overrides,
})

export const createCredit = (overrides: Partial<Credit> = {}) =>
  ({
    grade: '5',
    course_code: 'MAT11002',
    credits: 5,
    attainment_date: new Date(2020, 0, 1),
    student_studentnumber: '111',
    studyright_id: 'sr-1',
    credittypecode: CreditTypeCode.PASSED,
    isStudyModule: false,
    language: 'fi',
    semester: {
      yearcode: 2020,
      yearname: '2019-2020',
      semestercode: 140,
      name: { en: 'Spring 2020', fi: 'Kevät 2020', sv: 'Våren 2020' },
    } as Partial<Credit['semester']>,
    ...overrides,
  }) as Credit
