module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('progress_criteria', 'courses_year_four', {
      type: Sequelize.ARRAY(Sequelize.STRING),
    })
    await queryInterface.addColumn('progress_criteria', 'courses_year_five', {
      type: Sequelize.ARRAY(Sequelize.STRING),
    })
    await queryInterface.addColumn('progress_criteria', 'courses_year_six', {
      type: Sequelize.ARRAY(Sequelize.STRING),
    })
    await queryInterface.addColumn('progress_criteria', 'credits_year_four', {
      type: Sequelize.INTEGER,
    })
    await queryInterface.addColumn('progress_criteria', 'credits_year_five', {
      type: Sequelize.INTEGER,
    })
    await queryInterface.addColumn('progress_criteria', 'credits_year_six', {
      type: Sequelize.INTEGER,
    })
  },
  down: async () => {},
}
