const Course = require('./course')
const CourseProvider = require('./courseProvider')
const CourseType = require('./courseType')
const Credit = require('./credit')
const CreditTeacher = require('./creditTeacher')
const CreditType = require('./creditType')
const CurriculumPeriod = require('./curriculumPeriod')
const Enrollment = require('./enrollment')
const Organization = require('./organization')
const ProgrammeModule = require('./programmeModule')
const ProgrammeModuleChild = require('./programmeModuleChild')
const Semester = require('./semester')
const SISStudyRight = require('./SISStudyRight')
const SISStudyRightElement = require('./SISStudyRightElement')
const Student = require('./student')
const Studyplan = require('./studyplan')
const StudyrightExtent = require('./studyrightExtent')
const Teacher = require('./teacher')

const CREDIT_TYPE_CODES = {
  PASSED: 4,
  FAILED: 10,
  IMPROVED: 7,
  APPROVED: 9,
}

CourseType.hasMany(Course, { foreignKey: 'coursetypecode', sourceKey: 'coursetypecode' })
Course.belongsTo(CourseType, { foreignKey: 'coursetypecode', targetKey: 'coursetypecode' })

Course.belongsToMany(Organization, { through: CourseProvider, foreignKey: 'coursecode' })
Organization.belongsToMany(Course, { through: CourseProvider, foreignKey: 'organizationcode' })

ProgrammeModule.belongsTo(Organization, { foreignKey: 'organization_id' })
Organization.hasMany(ProgrammeModule, { foreignKey: 'organization_id' })

Credit.notUnnecessary = credit => credit.credits > 0 && credit.credits <= 12
Credit.passed = ({ credittypecode }) =>
  credittypecode === CREDIT_TYPE_CODES.PASSED || credittypecode === CREDIT_TYPE_CODES.APPROVED
Credit.failed = credit => credit.credittypecode === CREDIT_TYPE_CODES.FAILED
Credit.improved = credit => credit.credittypecode === CREDIT_TYPE_CODES.IMPROVED

Credit.belongsTo(Student, { foreignKey: 'student_studentnumber', targetKey: 'studentnumber' })
Student.hasMany(Credit, { foreignKey: 'student_studentnumber', sourceKey: 'studentnumber' })
Credit.belongsTo(SISStudyRight, { foreignKey: 'studyright_id', targetKey: 'id', constraints: false })
SISStudyRight.hasMany(Credit, { foreignKey: 'studyright_id', constraints: false })

Credit.belongsTo(Course, { foreignKey: 'course_id' })
Course.hasMany(Credit, { foreignKey: 'course_id' })

Credit.belongsTo(CreditType, { foreignKey: 'credittypecode', targetKey: 'credittypecode' })
Credit.belongsToMany(Teacher, { through: CreditTeacher, foreignKey: 'credit_id' })
Teacher.belongsToMany(Credit, { through: CreditTeacher, foreignKey: 'teacher_id' })

Studyplan.belongsTo(Student, { foreignKey: 'studentnumber', targetKey: 'studentnumber' })
Student.hasMany(Studyplan, { foreignKey: 'studentnumber', sourceKey: 'studentnumber' })

SISStudyRightElement.belongsTo(SISStudyRight, { foreignKey: 'studyRightId', targetKey: 'id' })
SISStudyRight.hasMany(SISStudyRightElement, { foreignKey: 'studyRightId', sourceKey: 'id' })

Studyplan.belongsTo(SISStudyRight, { foreignKey: 'sis_study_right_id', targetKey: 'id' })
SISStudyRight.hasMany(Studyplan, { foreignKey: 'sis_study_right_id', sourceKey: 'id' })

SISStudyRight.belongsTo(Student, { foreignKey: 'studentNumber', targetKey: 'studentnumber' })
Student.hasMany(SISStudyRight, { foreignKey: 'studentNumber', sourceKey: 'studentnumber' })

Credit.belongsTo(Semester, { foreignKey: { name: 'semester_composite', allowNull: false } })

Student.hasMany(Enrollment, { foreignKey: 'studentnumber', sourceKey: 'studentnumber' })
Enrollment.belongsTo(Student, { foreignKey: 'studentnumber', targetKey: 'studentnumber' })

Enrollment.belongsTo(SISStudyRight, { foreignKey: 'studyright_id', targetKey: 'id', constraints: false })
SISStudyRight.hasMany(Enrollment, { foreignKey: 'studyright_id', constraints: false })

ProgrammeModule.belongsToMany(ProgrammeModule, {
  as: 'parents',
  through: ProgrammeModuleChild,
  foreignKey: 'parentId',
})

ProgrammeModule.belongsToMany(ProgrammeModule, {
  as: 'children',
  through: ProgrammeModuleChild,
  foreignKey: 'childId',
})

Organization.hasMany(Organization, { foreignKey: 'parent_id', as: 'children' })

module.exports = {
  Course,
  CourseProvider,
  Credit,
  CreditTeacher,
  CreditType,
  CourseType,
  CREDIT_TYPE_CODES,
  CurriculumPeriod,
  Enrollment,
  Organization,
  ProgrammeModule,
  ProgrammeModuleChild,
  Semester,
  SISStudyRight,
  SISStudyRightElement,
  Student,
  Studyplan,
  StudyrightExtent,
  Teacher,
}
