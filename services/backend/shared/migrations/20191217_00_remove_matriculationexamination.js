module.exports = {
  up: async queryInterface => {
    return queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.removeColumn('student', 'matriculationexamination', { transaction })
    })
  },
  down: async () => {}
}
