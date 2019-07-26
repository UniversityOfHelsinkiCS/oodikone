module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query('DELETE FROM throughput')
  },
  down: () => {
  }
}
