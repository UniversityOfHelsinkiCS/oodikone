/** Borrowed from sequelize */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type { CurriculumDetails, CurriculumOption, CurriculumPeriod } from './curriculum'
export type { DetailedProgrammeRights } from './detailedProgrammeRights'
export type { Graduated, SpecialGroups, ProgrammeFilter, StatsType, YearType } from './faculty'
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

// ENUMS
export { CreditTypeCode } from './creditTypeCode'
export { GenderCode } from './genderCode'
export { EnrollmentState } from './enrollmentState'
export { EnrollmentType } from './enrollmentType'
export { ExtentCode } from './extentCode'
export { DegreeProgrammeType } from './degreeProgrammeType'
export { Phase } from './phase'
