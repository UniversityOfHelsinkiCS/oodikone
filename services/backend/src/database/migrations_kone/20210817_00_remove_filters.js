module.exports = {
  up: async ({ context: queryInterface }) => {
    await queryInterface.dropTable('filters')
  },
  down: async () => {},
}
