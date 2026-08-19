import { CreditTypeCode, DegreeProgrammeType, ExtentCode, Phase } from '@oodikone/shared/types'
import {
  FormattedStudent,
  StudentCourse,
  StudentStudyRight,
  StudentStudyRightElement,
} from '@oodikone/shared/types/studentData'

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
