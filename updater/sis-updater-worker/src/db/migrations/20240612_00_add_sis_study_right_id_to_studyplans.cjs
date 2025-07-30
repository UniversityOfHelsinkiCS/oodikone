const { STRING } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.addColumn('studyplan', 'sis_study_right_id', {
      type: STRING,
      references: {
        model: 'sis_study_rights',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    })
  },
  down: async queryInterface => {
    await queryInterface.removeColumn('studyplan', 'sis_study_right_id')
  },
}
