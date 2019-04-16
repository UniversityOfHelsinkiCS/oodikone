module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('error_data', 'createdAt', { type: Sequelize.DATE })
    await queryInterface.addColumn('error_data', 'updatedAt', { type: Sequelize.DATE })

  },
  down: async () => {
  }
}