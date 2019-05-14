module.exports = {
  up: async (queryInterface) => {
    await queryInterface.removeColumn('users', 'czar')
    await queryInterface.removeColumn('users', 'admin') 
  },
  down: async () => {
  }
}