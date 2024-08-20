module.exports = {
  up: async ({ context: queryInterface }) => {
    await queryInterface.dropTable('mandatory_courses')
    await queryInterface.dropTable('mandatory_course_labels')
  },
  down: async () => {},
}
