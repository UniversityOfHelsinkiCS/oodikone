import { Course } from '@oodikone/shared/models'
import { CreditTypeCode } from '@oodikone/shared/types'

export type CourseWithSubsId = Course & { subsId?: number }

export type ParsedCourse = {
  course_code: string
  date: string
  passed: boolean
  grade: string
  credits: number
  isStudyModuleCredit: boolean
  credittypecode: CreditTypeCode
  language: string
  studyright_id: string
}
