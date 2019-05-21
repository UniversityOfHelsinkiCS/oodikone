module.exports = {
    up: async (queryInterface, Sequelize) => {
      await queryInterface.sequelize.query('DELETE FROM productivity')
      await queryInterface.sequelize.query('DELETE FROM throughput')
    },
    down: (queryInterface) => {
    }
  }
