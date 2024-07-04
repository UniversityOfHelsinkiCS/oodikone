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

Credit.notUnnecessary = credit => {
  return credit.credits > 0 && credit.credits <= 12
}

const CREDIT_TYPE_CODES = {
  PASSED: 4,
  FAILED: 10,
  IMPROVED: 7,
  APPROVED: 9,
}

Credit.passed = ({ credittypecode }) =>
  credittypecode === CREDIT_TYPE_CODES.PASSED || credittypecode === CREDIT_TYPE_CODES.APPROVED
Credit.failed = credit => credit.credittypecode === CREDIT_TYPE_CODES.FAILED
Credit.improved = credit => credit.credittypecode === CREDIT_TYPE_CODES.IMPROVED

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
