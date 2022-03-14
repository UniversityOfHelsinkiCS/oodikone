module.exports = {
  up: async queryInterface => {
    await queryInterface.dropTable('thesis_courses')
  },
  down: async () => {},
}
