module.exports = {
  up: async queryInterface => {
    await queryInterface.dropTable('user_affiliation')
    await queryInterface.sequelize.query('DROP SEQUENCE IF EXISTS user_affilation_id_seq')
    await queryInterface.dropTable('affiliations')
    await queryInterface.sequelize.query('DROP SEQUENCE IF EXISTS affiliations_id_seq')
  },
  down: async () => {},
}
