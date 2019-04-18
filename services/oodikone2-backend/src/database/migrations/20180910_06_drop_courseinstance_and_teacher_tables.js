module.exports = {
  up: async (queryInterface) => {
    await queryInterface.dropTable('courseteacher')
    await queryInterface.dropTable('courseinstance')
  },
  down: async () => {
  }
}