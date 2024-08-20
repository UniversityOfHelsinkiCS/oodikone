module.exports = {
  up: async ({ context: queryInterface }) => {
    await queryInterface.dropTable('user_hy_group')
    await queryInterface.sequelize.query('DROP SEQUENCE IF EXISTS user_hy_group_id_seq')
    await queryInterface.dropTable('hy_groups')
    await queryInterface.sequelize.query('DROP SEQUENCE IF EXISTS hy_groups_id_seq')
  },
  down: async () => {},
}
