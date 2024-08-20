const { DATE } = require('sequelize')

module.exports = {
  up: async ({ context: queryInterface }) => {
    await queryInterface.addColumn('users', 'last_login', DATE)
  },
  down: async ({ context: queryInterface }) => {
    await queryInterface.removeColumn('users', 'last_login')
  },
}
