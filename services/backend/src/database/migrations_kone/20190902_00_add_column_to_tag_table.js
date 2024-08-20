const { STRING } = require('sequelize')

module.exports = {
  up: async ({ context: queryInterface }) => {
    await queryInterface.bulkDelete('tag', [])
    await queryInterface.addColumn('tag', 'year', { type: STRING })
  },
  down: async () => {},
}
