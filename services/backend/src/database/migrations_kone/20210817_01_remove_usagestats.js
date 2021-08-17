module.exports = {
  up: async queryInterface => {
    await queryInterface.dropTable('usage_statistics')
  },
  down: async () => {},
}
