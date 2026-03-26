const { JSONB } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.addColumn('sis_study_rights', 'transfer_info', JSONB)
  },
  down: async queryInterface => {
    await queryInterface.removeColumn('sis_study_rights', 'transfer_info')
  },
}
