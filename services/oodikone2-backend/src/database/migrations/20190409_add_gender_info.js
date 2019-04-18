module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('student', 'gender_code', { type: Sequelize.INTEGER })
    await queryInterface.addColumn('student', 'gender_fi', { type: Sequelize.STRING })
    await queryInterface.addColumn('student', 'gender_sv', { type: Sequelize.STRING })
    await queryInterface.addColumn('student', 'gender_en', { type: Sequelize.STRING })
  },
  down: async () => {
  }
}