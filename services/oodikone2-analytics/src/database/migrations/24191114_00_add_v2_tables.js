module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('productivity_v2', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true
      },
      data: Sequelize.JSONB,
      status: Sequelize.STRING,
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE
    })
    await queryInterface.createTable('throughput_v2', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true
      },
      data: Sequelize.JSONB,
      status: Sequelize.STRING,
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE
    })
  },
  down: () => {
    return null
  }
}
