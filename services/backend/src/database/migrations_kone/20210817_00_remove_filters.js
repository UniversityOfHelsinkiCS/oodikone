module.exports = {
  up: async queryInterface => {
    await queryInterface.dropTable('filters')
  },
  down: async () => {},
}
