const { STRING } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.addColumn('sis_study_rights', 'faculty_code', {
      type: STRING,
      references: {
        model: 'organization',
        key: 'code',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    })
  },
  down: async queryInterface => {
    await queryInterface.removeColumn('sis_study_rights', 'faculty_code')
  },
}
