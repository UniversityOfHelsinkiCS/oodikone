module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.changeColumn(
      'credit',
      'semestercode',
      { 
        type: Sequelize.INTEGER,
        allowNull: false
      }
    )
  },
  down: () => {
  }
}