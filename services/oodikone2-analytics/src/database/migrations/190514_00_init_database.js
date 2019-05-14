module.exports = {
    up: async (queryInterface, Sequelize) => {
      await queryInterface.createTable('productivity', {
        id: {
            type: Sequelize.STRING,
            primaryKey: true
        },
        data: Sequelize.JSONB,
        status: Sequelize.STRING,
        createdAt: Sequelize.DATE,
        updatedAt: Sequelize.DATE,
      })
      await queryInterface.createTable('throughput', {
        id: {
            type: Sequelize.STRING,
            primaryKey: true
        },
        data: Sequelize.JSONB,
        status: Sequelize.STRING,
        createdAt: Sequelize.DATE,
        updatedAt: Sequelize.DATE,
      })
    },
    down: (queryInterface) => {
      return null
    }
  }