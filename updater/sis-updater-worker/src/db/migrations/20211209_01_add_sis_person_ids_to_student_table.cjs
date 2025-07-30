const { STRING } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.addColumn('student', 'sis_person_id', {
      type: STRING,
    })
  },
  down: async queryInterface => {
    await queryInterface.removeColumn('student', 'sis_person_id')
  },
}
