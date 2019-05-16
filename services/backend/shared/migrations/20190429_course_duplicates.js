module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('course_duplicates', {
      groupid: {
        allowNull: false,
        type: Sequelize.INTEGER,
      },
      coursecode: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.STRING,
        references: {
          model: 'course',
          key: 'code'
        }
      },
      createdAt: {
        type: Sequelize.DATE
      },
      updatedAt: {
        type: Sequelize.DATE
      }
    })
  },

  down: queryInterface => {
    queryInterface.dropTable('course_duplicates')
  }
}
