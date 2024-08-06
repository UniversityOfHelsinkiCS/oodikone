/* eslint-disable import/no-cycle */
export { CourseWithSubsId } from './course'
export { CreditTypeCode } from './creditTypeCode'
export { Criteria } from './criteria'
export { DetailedProgrammeRights } from './detailedProgrammeRights'
export { ElementDetailType } from './elementDetailType'
export { EnrollmentState } from './enrollmentState'
export { EnrollmentType } from './enrollmentType'
export { ExtentCode } from './extentCode'
export { GenderCode } from './genderCode'
export { IamAccess } from './iamAccess'
export { Language } from './language'
export { Name } from './name'
export { Phase } from './phase'
export { PriorityCode } from './priorityCode'
export { Role } from './role'
export { StudyTrack } from './studyTrack'
export { Unification, UnifyStatus } from './unification'
export { ExpandedUser, FormattedUser } from './user'

/**
 * A utility type that extracts the type of the elements of an array. This type
 * takes a generic type `T` which extends an array of any type, and returns the
 * type of the elements in that array. If `T` is not an array, it returns `never`.
 *
 * @example
 * type ElementType = Unarray<number[]>; // number
 */
export type Unarray<T extends any[]> = T extends Array<infer U> ? U : never
