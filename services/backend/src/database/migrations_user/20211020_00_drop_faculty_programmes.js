module.exports = {
  up: async queryInterface => {
    await queryInterface.dropTable('faculty_programmes')
  },
  down: async () => {},
}
