module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query('DELETE FROM productivity')
    await queryInterface.sequelize.query('DELETE FROM throughput')
  },
  down: () => {
  }
}
