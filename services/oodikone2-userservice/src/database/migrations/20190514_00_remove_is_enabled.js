module.exports = {
  up: async (queryInterface) => {
    await queryInterface.removeColumn('users', 'is_enabled')
  },
  down: async () => {
  }
}