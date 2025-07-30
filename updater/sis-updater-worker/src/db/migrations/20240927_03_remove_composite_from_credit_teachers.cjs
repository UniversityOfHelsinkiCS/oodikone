const { STRING } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.removeColumn('credit_teachers', 'composite')
  },
  down: async queryInterface => {
    await queryInterface.addColumn('credit_teachers', 'composite', {
      type: STRING,
    })
  },
}
