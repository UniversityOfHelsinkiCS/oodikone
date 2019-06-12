module.exports = {
  up: async (queryInterface) => {
    await queryInterface.dropTable('tag')
    await queryInterface.dropTable('tag_student')
  },
  down: async () => {
  }
}
