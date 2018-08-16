module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('semesters', 'yearcode', { type: Sequelize.INTEGER })
    await queryInterface.addColumn('semesters', 'yearname', { type: Sequelize.STRING })
  },
  down: async () => {
  }
}