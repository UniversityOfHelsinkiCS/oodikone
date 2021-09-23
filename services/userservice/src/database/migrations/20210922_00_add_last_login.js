const { DATE } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.addColumn('users', 'last_login', DATE)
  },
  down: async queryInterface => {
    await queryInterface.removeColumn('users', 'last_login')
  },
}
