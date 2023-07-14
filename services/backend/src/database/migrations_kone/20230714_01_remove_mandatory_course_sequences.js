module.exports = {
  up: async queryInterface => {
    await queryInterface.sequelize.query('DROP SEQUENCE "mandatory_courses_id_seq"')
    await queryInterface.sequelize.query('DROP SEQUENCE "mandatory_course_labels_id_seq"')
  },
  down: async () => {},
}
