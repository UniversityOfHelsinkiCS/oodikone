const { BOOLEAN } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.addColumn('sis_study_rights', 'tvex', BOOLEAN)
  },
  down: async queryInterface => {
    await queryInterface.removeColumn('sis_study_rights', 'tvex')
  },
}
