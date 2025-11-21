import { Course } from '../models'

export type CourseWithSubsId = Course & { subsId?: number }
