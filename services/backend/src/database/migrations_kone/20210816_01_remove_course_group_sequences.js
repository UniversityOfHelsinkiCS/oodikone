module.exports = {
  up: async ({ context: queryInterface }) => {
    await queryInterface.sequelize.query('DROP SEQUENCE "course_groups_id_seq"')
    await queryInterface.sequelize.query('DROP SEQUENCE "teacher_course_group_id_seq"')
  },
  down: async () => {},
}
