const { BOOLEAN, DATE, INTEGER, JSONB, STRING } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.createTable('sis_study_right_elements', {
      id: {
        type: STRING,
        primaryKey: true,
      },
      start_date: DATE,
      end_date: DATE,
      graduated: BOOLEAN,
      phase: INTEGER,
      study_right_id: {
        type: STRING,
        references: {
          model: 'sis_study_rights',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      code: STRING,
      name: JSONB,
      study_tracks: JSONB,
      faculty_code: {
        type: STRING,
        references: {
          model: 'organization',
          key: 'code',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      created_at: DATE,
      updated_at: DATE,
    })
  },
  down: async queryInterface => {
    await queryInterface.dropTable('sis_study_right_elements')
  },
}
