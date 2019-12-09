module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('element_details', 'faculty_code', {
      type: Sequelize.STRING
    })
  },
  down: async () => {}
}
