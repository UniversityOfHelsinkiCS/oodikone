module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('mandatory_courses', 'label', { type: Sequelize.STRING })
  },
  down: async () => {
    await queryInterface.removeColumn('mandatory_courses', 'label')
  }
}
