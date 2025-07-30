const { JSONB } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.addColumn('course', 'substitutions', JSONB)
  },
  down: async () => {},
}
