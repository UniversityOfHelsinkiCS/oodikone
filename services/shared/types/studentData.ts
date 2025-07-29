import type { Enrollment, SISStudyRight, SISStudyRightElement, Student, Studyplan } from '../models'
import type { Tag, TagStudent } from '../models/kone'

import type { CriteriaYear, CreditTypeCode, Name } from '../types'

type StudentPersonalData = Pick<
  Student,
  | 'firstnames'
  | 'lastname'
  | 'studentnumber'
  | 'citizenships'
  | 'dateofuniversityenrollment'
  | 'creditcount'
  | 'abbreviatedname'
  | 'email'
  | 'secondary_email'
  | 'phone_number'
  | 'updatedAt'
  | 'gender_code'
  | 'birthdate'
  | 'sis_person_id'
>

type StudentStudyRightElement = Pick<
  SISStudyRightElement,
  'code' | 'name' | 'studyTrack' | 'graduated' | 'startDate' | 'endDate' | 'phase' | 'degreeProgrammeType'
>

export type StudentStudyRight = Pick<
  SISStudyRight,
  'id' | 'extentCode' | 'facultyCode' | 'admissionType' | 'cancelled' | 'semesterEnrollments' | 'startDate' | 'tvex'
> & {
  studyRightElements: Array<StudentStudyRightElement>
}

export type StudentStudyPlan = Pick<
  Studyplan,
  | 'included_courses'
  | 'programme_code'
  | 'includedModules'
  | 'completed_credits'
  | 'curriculum_period_id'
  | 'sis_study_right_id'
>

export type StudentData = StudentPersonalData & {
  studyplans: Array<StudentStudyPlan>
  studyRights: Array<StudentStudyRight>
}

export type StudentTags = TagStudent & {
  tag: Pick<Tag, 'tag_id' | 'tagname' | 'personal_user_id'>
}

export type TaggetStudentData = StudentData & {
  tags: StudentTags[]
}

export type FormattedStudent = {
  firstnames: string
  lastname: string
  started: Date
  studentNumber: string
  credits: number
  hopsCredits: number
  name: string
  gender_code: string
  email: string
  secondaryEmail: string
  phoneNumber: string
  updatedAt: Date
  tags: StudentTags[]
  studyrightStart: string
  option: { name: Name } | null
  birthdate: Date
  sis_person_id: string
  citizenships: Name[]
  criteriaProgress: { [year: string]: CriteriaYear }
  curriculumVersion: string | null

  transferredStudyright: boolean
  transferSource: string | undefined
  studyRights: StudentStudyRight[]
  studyplans: StudentStudyPlan[]
  courses: {
    course_code: string
    date: string
    passed: boolean
    grade: string
    credits: number
    isStudyModuleCredit: boolean
    credittypecode: CreditTypeCode
    language: string
    studyright_id: string
  }[]
  enrollments: Pick<Enrollment, 'course_code' | 'state' | 'enrollment_date_time'>[]
}
