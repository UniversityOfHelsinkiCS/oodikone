module.exports = {

  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('error_data', {
      id: {
        primaryKey: true,
        type: Sequelize.STRING,
      },
      data: {
        type: Sequelize.JSONB
      }
    })
  },
  down: queryInterface => {
    queryInterface.dropTable('error_data')
  }
}
