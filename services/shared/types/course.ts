import { Course } from '../models'

type CourseSubstitution = Pick<Course, 'code' | 'groupId' | 'name'>
export type CourseWithSubsDetails = Omit<Course, 'substitutionGroups'> & { substitutionGroups: CourseSubstitution[][] }
