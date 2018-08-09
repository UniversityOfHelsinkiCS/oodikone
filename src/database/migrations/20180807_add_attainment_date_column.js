module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('credit', 'attainment_date', { type: Sequelize.DATE })
  },
  down: async (queryInterface) => {
    queryInterface.dropColumn('credit', 'attainment_date')
  }
}