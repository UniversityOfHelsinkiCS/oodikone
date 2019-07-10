module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.dropTable('ldapuser', { transaction })
    })
  },
  down: async () => {
  }
}
