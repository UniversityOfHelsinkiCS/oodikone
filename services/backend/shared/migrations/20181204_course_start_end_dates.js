module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('course', 'startdate', { type: Sequelize.DATE })
    await queryInterface.addColumn('course', 'enddate', { type: Sequelize.DATE })
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('course', 'startdate')
    await queryInterface.removeColumn('enddate', 'enddate')
  }
}
