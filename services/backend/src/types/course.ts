/* eslint-disable import/no-cycle */
import { InferAttributes } from 'sequelize'

import { Course } from '../models'
import { CreditTypeCode } from './creditTypeCode'

export type CourseWithSubsId = InferAttributes<Course> & { subsId?: number }

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
