module.exports = {
  up: async ({ context: queryInterface }) => {
    await queryInterface.dropTable('faculty_programmes')
  },
  down: async () => {},
}
