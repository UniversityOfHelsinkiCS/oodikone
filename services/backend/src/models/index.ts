import { Student } from './student'
import { Enrollment } from './enrollment'
import { CreditType } from './creditType'
import { Studyright } from './studyright'
import { Credit } from './credit'
import { SemesterEnrollment } from './semesterEnrollment'
import { Semester } from './semester'
import { Course } from './course'
import { StudyrightExtent } from './studyrightExtent'
import { StudyrightElement } from './studyrightElement'
import { ElementDetail } from './elementDetail'
import { Studyplan } from './studyplan'
import { Transfer } from './transfer'
import { ProgrammeModule } from './programmeModule'
import { ProgrammeModuleChild } from './programmeModuleChild'
import { Organization } from './organization'
import { CourseProvider } from './courseProvider'
import { SISStudyRight } from './SISStudyRight'
import { SISStudyRightElement } from './SISStudyRightElement'
import { CourseType } from './courseType'
import { CreditTeacher } from './creditTeacher'
import { ExcludedCourse } from './excludedCourse'
import { Teacher } from './teacher'

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
