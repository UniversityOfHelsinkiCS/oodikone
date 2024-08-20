module.exports = {
  up: async ({ context: queryInterface }) => {
    await queryInterface.dropTable('unit_tag')
  },
  down: async () => {},
}
