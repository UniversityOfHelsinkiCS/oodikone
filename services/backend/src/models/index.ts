import { CreditTypeCode } from '../types/creditTypeCode'
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
