module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('tag', [])
    await queryInterface.addColumn('tag', 'year', { type: Sequelize.STRING })
  },
  down: async () => {}
}
