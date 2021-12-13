const { BOOLEAN } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.addColumn('credit', 'is_open', {
      type: BOOLEAN,
    })
  },
  down: async queryInterface => {
    await queryInterface.deleteColumn('credit', 'is_open')
  },
}
