const { STRING } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.addColumn('studyplan', 'included_modules', {
      type: STRING,
    })
  },
  down: async queryInterface => {
    await queryInterface.removeColumn('studyplan', 'included_modules')
  },
}
