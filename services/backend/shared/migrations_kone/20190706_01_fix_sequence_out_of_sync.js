module.exports = {
  up: async (queryInterface) => {
    return queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.sequelize.query('SELECT setval(\'mandatory_courses_id_seq\', (SELECT MAX(id) FROM mandatory_courses))', { transaction })
      await queryInterface.sequelize.query('SELECT setval(\'course_groups_id_seq\', (SELECT MAX(id) FROM course_groups))', { transaction })
      await queryInterface.sequelize.query('SELECT setval(\'mandatory_course_labels_id_seq\', (SELECT MAX(id) FROM mandatory_course_labels))', { transaction })
      await queryInterface.sequelize.query('SELECT setval(\'tag_tag_id_seq\', (SELECT MAX(tag_id) FROM tag))', { transaction })
      await queryInterface.sequelize.query('SELECT setval(\'tag_student_id_seq\', (SELECT MAX(id) FROM tag_student))', { transaction })
      await queryInterface.sequelize.query('SELECT setval(\'teacher_course_group_id_seq\', (SELECT MAX(id) FROM teacher_course_groups))', { transaction })
    })
  },
  down: async () => {
  }
}
