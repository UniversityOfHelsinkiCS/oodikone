module.exports = {
  up: async queryInterface => {
    await queryInterface.dropTable('access_groups')
  },
  down: async () => {},
}
