module.exports = {
  up: async queryInterface => {
    return queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.sequelize.query('DROP MATERIALIZED VIEW organization_yearly_credits', { transaction })
      await queryInterface.dropTable('semester_enrollments', { transaction })
      await queryInterface.dropTable('transfers', { transaction })
      await queryInterface.dropTable('studyright_elements', { transaction })
      await queryInterface.dropTable('element_details', { transaction })
      await queryInterface.dropTable('studyright', { transaction })
    })
  },
  down: async () => {},
}
