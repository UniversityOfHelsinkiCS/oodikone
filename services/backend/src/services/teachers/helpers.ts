import { Credit } from '@oodikone/shared/models'

export const isRegularCourse = (credit: Credit) => !credit.isStudyModule

export type TeacherStats = {
  id: string
  name: string
  credits: number
  passed: number
  failed: number
  transferred: number
}
