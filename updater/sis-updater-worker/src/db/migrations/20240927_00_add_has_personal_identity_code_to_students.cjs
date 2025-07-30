const { BOOLEAN } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.addColumn('student', 'has_personal_identity_code', BOOLEAN)
  },
  down: async queryInterface => {
    await queryInterface.removeColumn('student', 'has_personal_identity_code')
  },
}
