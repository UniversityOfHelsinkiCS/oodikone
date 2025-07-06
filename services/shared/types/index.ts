/**
 * A utility type that extracts the type of the elements of an array. This type
 * takes a generic type `T` which extends an array of any type, and returns the
 * type of the elements in that array. If `T` is not an array, it returns `never`.
 *
 * @example
 * type ElementType = Unarray<number[]>; // number
 */
export type Unarray<T extends any[]> = T extends Array<infer U> ? U : never

/** Borrowed from sequelize */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/* ~~~ Imports ~~~ */
export type { CurriculumDetails, CurriculumOption, CurriculumPeriod } from './curriculum'
export type { DetailedProgrammeRights } from './detailedProgrammeRights'
export type {
  Graduated,
  SpecialGroups,
  ProgrammeFilter,
  StatsType,
  YearType,
  ProgrammeModuleWithRelevantAttributes,
} from './faculty'
export type {
  FacultyClassSizes,
  GraduationStats,
  GraduationStatistics,
  ProgrammeClassSizes,
  ProgrammeMedians,
} from './graduations'
export type { EncrypterData } from './encryption'
export type { Name, NameWithCode } from './name'
export type { ProgressCriteria } from './progressCriteria'
export type { Release } from './release'
export type { Role } from './role'
export type {
  GraduationTimes,
  MedianEntry,
  Module,
  ProgrammeCourse,
  ProgrammeModule,
  ProgrammeOrStudyTrackGraduationStats,
  StudyProgrammeCourse,
  StudyTrackStats,
} from './studyProgramme'
export type { NewTag, StudentTag, Tag } from './tag'
export type { SemesterEnrollment } from './semesterEnrollment'
export type { StudyTrack } from './studyTrack'
export type { UnifyStatus } from './unification'

// ENUMS
export { CreditTypeCode } from './creditTypeCode'
export { GenderCode } from './genderCode'
export { EnrollmentState } from './enrollmentState'
export { EnrollmentType } from './enrollmentType'
export { ExtentCode } from './extentCode'
export { DegreeProgrammeType } from './degreeProgrammeType'
export { Phase } from './phase'
export { Unification } from './unification'
