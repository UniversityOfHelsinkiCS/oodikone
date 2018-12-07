module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('course', 'min_attainment_date', { type: Sequelize.DATE })
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('course', 'min_attainment_date')
  }
}
