const { BOOLEAN, DATE, INTEGER, JSONB, STRING } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.createTable('sis_study_rights', {
      id: {
        primaryKey: true,
        type: STRING,
      },
      start_date: DATE,
      end_date: DATE,
      study_start_date: DATE,
      cancelled: BOOLEAN,
      student_number: {
        type: STRING,
        references: {
          model: 'student',
          key: 'studentnumber',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      extent_code: {
        type: INTEGER,
        references: {
          model: 'studyright_extents',
          key: 'extentcode',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      admission_type: STRING,
      semester_enrollments: JSONB,
      created_at: DATE,
      updated_at: DATE,
    })
  },
  down: async queryInterface => {
    await queryInterface.dropTable('sis_study_rights')
  },
}
