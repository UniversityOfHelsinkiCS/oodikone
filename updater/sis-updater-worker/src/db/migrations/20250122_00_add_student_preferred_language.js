const { STRING } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.addColumn('student', 'preferred_language', {
      type: STRING,
    })
  },
  down: async queryInterface => {
    await queryInterface.removeColumn('student', 'preferred_language')
  },
}
