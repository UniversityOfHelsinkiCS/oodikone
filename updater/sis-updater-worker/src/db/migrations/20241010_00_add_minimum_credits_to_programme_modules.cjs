const { INTEGER } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.addColumn('programme_modules', 'minimum_credits', {
      type: INTEGER,
    })
  },
  down: async queryInterface => {
    await queryInterface.removeColumn('programme_modules', 'minimum_credits')
  },
}
