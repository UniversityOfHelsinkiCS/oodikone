const { DATE } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.addColumn('programme_modules', 'valid_from', {
      type: DATE,
    })
    await queryInterface.addColumn('programme_modules', 'valid_to', {
      type: DATE,
    })
  },
  down: async queryInterface => {
    await queryInterface.deleteColumn('programme_modules', 'valid_from')
    await queryInterface.deleteColumn('programme_modules', 'valid_to')
  },
}
