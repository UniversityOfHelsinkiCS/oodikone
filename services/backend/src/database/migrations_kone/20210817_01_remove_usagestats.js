module.exports = {
  up: async ({ context: queryInterface }) => {
    await queryInterface.dropTable('usage_statistics')
  },
  down: async () => {},
}
