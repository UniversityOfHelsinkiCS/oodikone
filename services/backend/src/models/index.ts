/* eslint-disable import/no-cycle */
import { CreditTypeCode } from '../types'
import { Course } from './course'
import { CourseProvider } from './courseProvider'
import { CourseType } from './courseType'
import { Credit } from './credit'
import { CreditTeacher } from './creditTeacher'
import { CreditType } from './creditType'
import { CurriculumPeriod } from './curriculumPeriod'
import { Enrollment } from './enrollment'
import { Organization } from './organization'
import { ProgrammeModule } from './programmeModule'
import { ProgrammeModuleChild } from './programmeModuleChild'
import { Semester } from './semester'
import { SemesterEnrollment } from './semesterEnrollment'
import { SISStudyRight } from './SISStudyRight'
import { SISStudyRightElement } from './SISStudyRightElement'
import { Student } from './student'
import { Studyplan } from './studyplan'
import { StudyrightExtent } from './studyrightExtent'
import { Teacher } from './teacher'

Credit.passed = ({ credittypecode }) => [CreditTypeCode.PASSED, CreditTypeCode.APPROVED].includes(credittypecode)
Credit.failed = ({ credittypecode }) => credittypecode === CreditTypeCode.FAILED
Credit.improved = ({ credittypecode }) => credittypecode === CreditTypeCode.IMPROVED
Credit.notUnnecessary = ({ credits }) => credits > 0 && credits <= 12

export {
  Course,
  CourseProvider,
  CourseType,
  Credit,
  CreditTeacher,
  CreditType,
  CurriculumPeriod,
  Enrollment,
  Organization,
  ProgrammeModule,
  ProgrammeModuleChild,
  Semester,
  SemesterEnrollment,
  SISStudyRight,
  SISStudyRightElement,
  Student,
  Studyplan,
  StudyrightExtent,
  Teacher,
}
