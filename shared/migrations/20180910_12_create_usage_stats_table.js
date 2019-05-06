module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('usage_statistics', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
      },
      username: {
        type: Sequelize.STRING
      },
      name: {
        type: Sequelize.STRING
      },
      time: {
        type: Sequelize.INTEGER
      },
      admin: {
        type: Sequelize.BOOLEAN
      },
      method: {
        type: Sequelize.STRING
      },
      URL: {
        type: Sequelize.STRING
      },
      status: {
        type: Sequelize.INTEGER
      },
      data: {
        type: Sequelize.JSONB
      },
    })
  },
  down: async () => {
  }
}
