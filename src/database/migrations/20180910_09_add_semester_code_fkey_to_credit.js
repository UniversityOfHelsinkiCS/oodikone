module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('credit', 'semestercode', {
      type: Sequelize.INTEGER,
      references: {
        model: 'semesters',
        key: 'semestercode'
      }
    }
    )
  },
  down: async () => {
  }
}