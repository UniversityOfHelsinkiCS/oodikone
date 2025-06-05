const { ARRAY, STRING } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.addColumn('sis_study_rights', 'expiration_rule_urns', ARRAY(STRING))
  },
  down: async queryInterface => {
    await queryInterface.removeColumn('sis_study_rights', 'expiration_rule_urns')
  },
}
