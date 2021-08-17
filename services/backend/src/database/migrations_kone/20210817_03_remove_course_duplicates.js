module.exports = {
  up: async queryInterface => {
    await queryInterface.dropTable('course_duplicates')
  },
  down: async () => {},
}
