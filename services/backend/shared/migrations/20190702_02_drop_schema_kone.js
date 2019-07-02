module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.dropSchema('kone_data', { transaction })
    })
  },
  down: async () => {
  }
}
