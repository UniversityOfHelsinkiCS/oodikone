const Organization = require('./organization')
const CourseType = require('./courseType')
const Course = require('./course')

CourseType.hasMany(Course, { foreignKey: 'coursetypecode', sourceKey: 'coursetypecode' })
Course.belongsTo(CourseType, { foreignKey: 'coursetypecode', targetKey: 'coursetypecode' })

module.exports = {
  Organization,
  Course,
  CourseType
}
