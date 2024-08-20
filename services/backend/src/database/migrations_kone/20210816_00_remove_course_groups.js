module.exports = {
  up: async ({ context: queryInterface }) => {
    await queryInterface.dropTable('teacher_course_groups')
    await queryInterface.dropTable('course_groups')
  },
  down: async () => {},
}
