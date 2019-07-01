module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('student', 'home_country_en', { type: Sequelize.STRING })
    await queryInterface.addColumn('student', 'home_country_fi', { type: Sequelize.STRING })
    await queryInterface.addColumn('student', 'home_country_sv', { type: Sequelize.STRING })
  },
  down: async () => {
    await queryInterface.removeColumn('student', 'home_country_en')
    await queryInterface.removeColumn('student', 'home_country_fi')
    await queryInterface.removeColumn('student', 'home_country_sv')
  }
}
