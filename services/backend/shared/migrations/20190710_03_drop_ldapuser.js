module.exports = {
  up: async (queryInterface) => {
    return queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.dropTable('ldapuser', { transaction })
    })
  },
  down: async () => {
  }
}
