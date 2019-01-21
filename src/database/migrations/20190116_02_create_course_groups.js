const { Teacher, CourseGroup } = require('../../models')
module.exports = {
  up: async () => {
    Teacher.associate = models => {
      Teacher.belongsToMany(models.CourseGroup, { through: 'teacher_course_group' })
    }
    CourseGroup.associate = models => {
      CourseGroup.belongsToMany(models.Teacher, { through: 'teacher_course_group' })
    }
  },
  down: async () => {
  }
}