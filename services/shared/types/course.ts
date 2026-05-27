import { Course } from '../models'

export type CourseWithSubsId = Omit<Course, 'substitution_groups'> & { substitution_groups: Course[][] } & {
  subsId?: number
}
