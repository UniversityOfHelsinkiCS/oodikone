module.exports = {
  up: async ({ context: queryInterface }) => {
    await queryInterface.dropTable('thesis_courses')
  },
  down: async () => {},
}
