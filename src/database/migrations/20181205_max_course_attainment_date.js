module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('course', 'max_attainment_date', { type: Sequelize.DATE })
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('course', 'max_attainment_date')
  }
}
