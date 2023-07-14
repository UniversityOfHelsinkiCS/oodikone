module.exports = {
  up: async queryInterface => {
    await queryInterface.dropTable('mandatory_courses')
    await queryInterface.dropTable('mandatory_course_labels')
  },
  down: async () => {},
}
