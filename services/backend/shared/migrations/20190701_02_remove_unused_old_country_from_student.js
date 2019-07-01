module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('student', 'country')
  },
  down: async () => {
    await queryInterface.addColumn('student', 'country', { type: Sequelize.STRING })

  }
}
