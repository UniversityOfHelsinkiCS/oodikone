module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.removeConstraint('course_groups', 'course_groups_programmeid_fkey', { transaction }),
      await queryInterface.removeConstraint('teacher_course_group', 'teacher_course_group_teacher_id_fkey', { transaction }),
      await queryInterface.removeConstraint('teacher_course_group', 'teacher_course_group_course_group_id_fkey', { transaction }),
      await queryInterface.removeConstraint('mandatory_courses', 'mandatory_courses_course_code_fkey', { transaction }),
      await queryInterface.removeConstraint('tag_student', 'tag_student_taggedstudents_studentnumber_fkey', { transaction }),
      await queryInterface.removeConstraint('tag_student', 'tag_student_tags_tagname_fkey', { transaction }),
      await queryInterface.removeConstraint('unit_tag', 'unit_tag_unit_id_fkey', { transaction }),

      await queryInterface.createSchema('kone_data', { transaction }),
      await queryInterface.sequelize.query('ALTER TABLE course_groups SET SCHEMA kone_data', { transaction }),
      await queryInterface.sequelize.query('ALTER TABLE teacher_course_group SET SCHEMA kone_data', { transaction }),
      await queryInterface.sequelize.query('ALTER TABLE mandatory_courses SET SCHEMA kone_data', { transaction }),
      await queryInterface.sequelize.query('ALTER TABLE filters SET SCHEMA kone_data', { transaction }),
      await queryInterface.sequelize.query('ALTER TABLE usage_statistics SET SCHEMA kone_data', { transaction }),
      await queryInterface.sequelize.query('ALTER TABLE tag SET SCHEMA kone_data', { transaction }),
      await queryInterface.sequelize.query('ALTER TABLE tag_student SET SCHEMA kone_data', { transaction }),
      await queryInterface.sequelize.query('ALTER TABLE unit_tag SET SCHEMA kone_data', { transaction })
    })
  },

  down: async () => {
  }
}
