const { teacherStudyGroups } = require('../data/teacher_course_groups')

module.exports = {
  up: async queryInterface => {
    await queryInterface.bulkInsert(
      'teacher_course_group',
      teacherStudyGroups,
      {}
    )
  },
  down: async queryInterface => {
    await queryInterface.bulkInsert('teacher_course_group', {})
  }
}
