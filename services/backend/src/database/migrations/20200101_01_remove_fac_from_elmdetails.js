module.exports = {
  up: async queryInterface => {
    return queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.removeColumn('element_details', 'faculty_code', { transaction })
    })
  },
  down: async () => {},
}
