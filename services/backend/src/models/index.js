const Organization = require('./organization')
const CourseType = require('./courseType')
const Course = require('./course')
const Student = require('./student')
const CourseProvider = require('./courseProvider')
const Semester = require('./semester')
const SemesterEnrollment = require('./semesterEnrollment')
const Teacher = require('./teacher')
const CreditType = require('./creditType')
const Credit = require('./credit')
const CreditTeacher = require('./creditTeacher')
const ElementDetail = require('./elementDetail')
const Studyplan = require('./studyplan')
const StudyrightExtent = require('./studyrightExtent')
const Studyright = require('./studyright')
const StudyrightElement = require('./studyrightElement')
const Transfer = require('./transfer')
const ProgrammeModule = require('./programmeModule')
const ProgrammeModuleChild = require('./programmeModuleChild')
const ExcludedCourse = require('./excludedCourse')
const Enrollment = require('./enrollment')

CourseType.hasMany(Course, { foreignKey: 'coursetypecode', sourceKey: 'coursetypecode' })
Course.belongsTo(CourseType, { foreignKey: 'coursetypecode', targetKey: 'coursetypecode' })

Course.belongsToMany(Organization, { through: CourseProvider, foreignKey: 'coursecode' })
Organization.belongsToMany(Course, { through: CourseProvider, foreignKey: 'organizationcode' })

SemesterEnrollment.belongsTo(Student, { foreignKey: 'studentnumber', targetKey: 'studentnumber' })
Student.hasMany(SemesterEnrollment, { foreignKey: 'studentnumber', sourceKey: 'studentnumber' })

SemesterEnrollment.belongsTo(Semester, { foreignKey: 'semestercomposite', targetKey: 'composite' })
Semester.hasMany(SemesterEnrollment, { foreignKey: 'semestercomposite', sourceKey: 'composite' })

ProgrammeModule.belongsTo(Organization, { foreignKey: 'organization_id' })
Organization.hasMany(ProgrammeModule, { foreignKey: 'organization_id' })

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
Credit.belongsTo(Studyright, { foreignKey: 'studyright_id', targetKey: 'studyrightid', constraints: false })
Studyright.hasMany(Credit, { foreignKey: 'studyright_id', constraints: false })

Credit.belongsTo(Student, { foreignKey: 'student_studentnumber', targetKey: 'studentnumber' })
Student.hasMany(Credit, { foreignKey: 'student_studentnumber', sourceKey: 'studentnumber' })

Credit.belongsTo(Course, { foreignKey: 'course_id' })
Course.hasMany(Credit, { foreignKey: 'course_id' })

Credit.belongsTo(CreditType, { foreignKey: 'credittypecode', targetKey: 'credittypecode' })
Credit.belongsToMany(Teacher, { through: CreditTeacher, foreignKey: 'credit_id' })
Teacher.belongsToMany(Credit, { through: CreditTeacher, foreignKey: 'teacher_id' })

Organization.hasMany(Studyright, { foreignKey: 'facultyCode', sourceKey: 'code' })
Studyright.belongsTo(Organization, { foreignKey: 'facultyCode', targetKey: 'code' })

Studyplan.belongsTo(Student, { foreignKey: 'studentnumber', targetKey: 'studentnumber' })
Student.hasMany(Studyplan, { foreignKey: 'studentnumber', sourceKey: 'studentnumber' })

Studyplan.belongsTo(Studyright, { foreignKey: 'studyrightid', targetKey: 'studyrightid' })
Studyright.hasMany(Studyplan, { foreignKey: 'studyrightid', sourceKey: 'studyrightid' })

Studyright.belongsTo(Student, { foreignKey: 'studentStudentnumber', targetKey: 'studentnumber' })
Student.hasMany(Studyright, { foreignKey: 'studentStudentnumber', sourceKey: 'studentnumber' })

StudyrightElement.belongsTo(Studyright, { foreignKey: 'studyrightid', targetKey: 'studyrightid' })
Studyright.hasMany(StudyrightElement, { foreignKey: 'studyrightid', sourceKey: 'studyrightid' })

StudyrightElement.belongsTo(ElementDetail, { foreignKey: 'code', targetKey: 'code' })
ElementDetail.hasMany(StudyrightElement, { foreignKey: 'code', sourceKey: 'code' })

StudyrightElement.belongsTo(Student, { foreignKey: 'studentnumber', targetKey: 'studentnumber' })
Student.hasMany(StudyrightElement, { foreignKey: 'studentnumber', sourceKey: 'studentnumber' })

StudyrightExtent.hasMany(Studyright, { foreignKey: 'extentcode', sourceKey: 'extentcode' })
Studyright.belongsTo(StudyrightExtent, { foreignKey: 'extentcode', targetKey: 'extentcode' })

Credit.belongsTo(Semester, { foreignKey: { name: 'semester_composite', allowNull: false } })

Transfer.belongsTo(Student, { foreignKey: 'studentnumber', targetKey: 'studentnumber' })
Student.hasMany(Transfer, { foreignKey: 'studentnumber', sourceKey: 'studentnumber' })

Transfer.belongsTo(Studyright, { foreignKey: 'studyrightid', targetKey: 'studyrightid' })
Studyright.hasMany(Transfer, { foreignKey: 'studyrightid', sourceKey: 'studyrightid' })

Transfer.belongsTo(ElementDetail, { as: 'source', foreignKey: 'sourcecode' })
Transfer.belongsTo(ElementDetail, { as: 'target', foreignKey: 'targetcode' })

Enrollment.belongsTo(Student, { foreignKey: 'studentnumber', targetKey: 'studentnumber' })
Enrollment.belongsTo(Studyright, { foreignKey: 'studyright_id', targetKey: 'studyrightid', constraints: false })
Studyright.hasMany(Enrollment, { foreignKey: 'studyright_id', constraints: false })

Student.hasMany(Enrollment, { foreignKey: 'studentnumber', sourceKey: 'studentnumber' })
Enrollment.belongsTo(Course, { foreignKey: 'course_id' })
Course.hasMany(Enrollment, { foreignKey: 'course_id' })
Enrollment.belongsTo(Semester, { foreignKey: { name: 'semester_composite', allowNull: false } })

ProgrammeModule.belongsToMany(ProgrammeModule, {
  as: 'parents',
  through: ProgrammeModuleChild,
  foreignKey: 'child_id',
})
ProgrammeModule.belongsToMany(ProgrammeModule, {
  as: 'children',
  through: ProgrammeModuleChild,
  foreignKey: 'parent_id',
})

Organization.hasMany(Organization, { foreignKey: 'parent_id', as: 'children' })

module.exports = {
  Organization,
  Course,
  CourseType,
  Student,
  CourseProvider,
  Semester,
  SemesterEnrollment,
  Teacher,
  CreditType,
  Credit,
  CreditTeacher,
  ElementDetail,
  Studyplan,
  StudyrightExtent,
  Studyright,
  StudyrightElement,
  Transfer,
  ProgrammeModule,
  ProgrammeModuleChild,
  ExcludedCourse,
  Enrollment,
}
