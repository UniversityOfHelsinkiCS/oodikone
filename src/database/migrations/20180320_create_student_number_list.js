module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.createTable('student_list', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      key: {
        type: Sequelize.STRING
      },
      description: {
        type: Sequelize.STRING 
      },
      student_numbers: {
        type: Sequelize.JSONB
      }
    })
  },

  down: (queryInterface) => {
    return queryInterface.dropTable('student_list')
  }
}