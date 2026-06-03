import { Course } from '../models'

export type CourseWithSubsDetails = Omit<Course, 'substitution_groups'> & { substitution_groups: Course[][] }
