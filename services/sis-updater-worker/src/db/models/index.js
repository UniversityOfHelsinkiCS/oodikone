const Organization = require('./organization')
const CourseType = require('./courseType')
const Course = require('./course')
const Student = require('./student')
const CourseProvider = require('./courseProvider')
const Semester = require('./semester')
const SemesterEnrollment = require('./semesterEnrollment')

CourseType.hasMany(Course, { foreignKey: 'coursetypecode', sourceKey: 'coursetypecode' })
Course.belongsTo(CourseType, { foreignKey: 'coursetypecode', targetKey: 'coursetypecode' })

Course.belongsToMany(Organization, { through: CourseProvider, foreignKey: 'coursecode' })
Organization.belongsToMany(Course, { through: CourseProvider, foreignKey: 'organizationcode' })

SemesterEnrollment.belongsTo(Student, { foreignKey: 'studentnumber', targetKey: 'studentnumber' })
Student.hasMany(SemesterEnrollment, { foreignKey: 'studentnumber', sourceKey: 'studentnumber' })

SemesterEnrollment.belongsTo(Semester, { foreignKey: 'semestercomposite', targetKey: 'composite' })
Semester.hasMany(SemesterEnrollment, { foreignKey: 'semestercomposite', sourceKey: 'composite' })

module.exports = {
  Organization,
  Course,
  CourseType,
  Student,
  CourseProvider,
  Semester,
  SemesterEnrollment
}
