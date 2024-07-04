import { Course } from './course'
import { CourseProvider } from './courseProvider'
import { CourseType } from './courseType'
import { Credit } from './credit'
import { CreditTeacher } from './creditTeacher'
import { CreditType } from './creditType'
import { ElementDetail } from './elementDetail'
import { Enrollment } from './enrollment'
import { ExcludedCourse } from './excludedCourse'
import { Organization } from './organization'
import { ProgrammeModule } from './programmeModule'
import { ProgrammeModuleChild } from './programmeModuleChild'
import { Student } from './student'
import { Semester } from './semester'
import { SemesterEnrollment } from './semesterEnrollment'
import { SISStudyRight } from './SISStudyRight'
import { SISStudyRightElement } from './SISStudyRightElement'
import { Studyplan } from './studyplan'
import { Studyright } from './studyright'
import { StudyrightElement } from './studyrightElement'
import { StudyrightExtent } from './studyrightExtent'
import { Teacher } from './teacher'
import { Transfer } from './transfer'

enum CreditTypeCode {
  PASSED = 4,
  IMPROVED = 7,
  APPROVED = 9,
  FAILED = 10,
}

Credit.passed = credit => [CreditTypeCode.PASSED, CreditTypeCode.APPROVED].includes(credit.credittypecode)
Credit.failed = credit => credit.credittypecode === CreditTypeCode.FAILED
Credit.improved = credit => credit.credittypecode === CreditTypeCode.IMPROVED
Credit.notUnnecessary = credit => credit.credits > 0 && credit.credits <= 12

export {
  Course,
  CourseProvider,
  CourseType,
  Credit,
  CreditTeacher,
  CreditType,
  ElementDetail,
  Enrollment,
  ExcludedCourse,
  Organization,
  ProgrammeModule,
  ProgrammeModuleChild,
  Semester,
  SemesterEnrollment,
  SISStudyRight,
  SISStudyRightElement,
  Student,
  Studyplan,
  Studyright,
  StudyrightExtent,
  StudyrightElement,
  Teacher,
  Transfer,
}
