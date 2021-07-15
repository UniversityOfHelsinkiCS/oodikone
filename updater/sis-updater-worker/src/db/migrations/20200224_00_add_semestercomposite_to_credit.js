const { STRING } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.addColumn('credit', 'semester_composite', {
      type: STRING,
      references: {
        model: 'semesters',
        key: 'composite',
      },
    })
  },
  down: async () => {},
}
