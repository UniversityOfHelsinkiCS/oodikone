module.exports = {
  up: async ({ context: queryInterface }) => {
    await queryInterface.dropTable('access_groups')
  },
  down: async () => {},
}
