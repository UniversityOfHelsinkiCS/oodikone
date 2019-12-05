module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('studyright', 'faculty_code', {
      type: Sequelize.STRING
    })
  },
  down: async () => {}
}
