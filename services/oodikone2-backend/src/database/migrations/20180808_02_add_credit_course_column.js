module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn(
      'credit', 
      'course_code', 
      { 
        type: Sequelize.STRING,
        references: {
          model: 'course',
          key: 'code',
          foreignKey: 'credit_course_fkey'
        },
      }
    )
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('credit', 'course_code')
  }
}