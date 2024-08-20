module.exports = {
  up: async ({ context: queryInterface }) => {
    await queryInterface.dropTable('course_duplicates')
  },
  down: async () => {},
}
