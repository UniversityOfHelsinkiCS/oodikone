const { STRING } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.removeColumn('student', 'country_fi')
    await queryInterface.removeColumn('student', 'country_sv')
    await queryInterface.removeColumn('student', 'country_en')
  },
  down: async queryInterface => {
    await queryInterface.addColumn('student', 'country_fi', {
      type: STRING,
    })
    await queryInterface.addColumn('student', 'country_sv', {
      type: STRING,
    })
    await queryInterface.addColumn('student', 'country_en', {
      type: STRING,
    })
  },
}
