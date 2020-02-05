const Organization = require('./organization')
const CourseType = require('./courseType')
const Course = require('./course')
const Student = require('./student')
const CourseProvider = require('./courseProvider')

CourseType.hasMany(Course, { foreignKey: 'coursetypecode', sourceKey: 'coursetypecode' })
Course.belongsTo(CourseType, { foreignKey: 'coursetypecode', targetKey: 'coursetypecode' })

Course.belongsToMany(Organization, { through: CourseProvider, foreignKey: 'coursecode' })
Organization.belongsToMany(Course, { through: CourseProvider, foreignKey: 'organizationcode' })

module.exports = {
  Organization,
  Course,
  CourseType,
  Student,
  CourseProvider
}
