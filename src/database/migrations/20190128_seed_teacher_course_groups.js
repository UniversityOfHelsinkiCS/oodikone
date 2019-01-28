const { teacherStudyGroups } = require('../data/teacher_course_groups')

module.exports = {
  up: async queryInterface => {
    await queryInterface.bulkDelete(
      'teacher_course_group',
      {}
    )
    teacherStudyGroups.forEach(async association => {
      await queryInterface.sequelize.query(
        `
INSERT INTO teacher_course_group (teacher_id, course_group_id)
SELECT :teacher_id, id FROM course_groups WHERE name = :course_group_name
        `,
        {
          replacements: {
            teacher_id: association.teacher_id,
            course_group_name: association.course_group_name
          }
        }
      )
    })
  },
  down: async queryInterface => {
    await queryInterface.bulkDelete(
      'teacher_course_group',
      {}
    )
  }
}
