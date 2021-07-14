const { DATE, INTEGER, STRING } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.createTable('studyright', {
      studyrightid: {
        primaryKey: true,
        type: STRING,
      },
      canceldate: {
        type: DATE,
      },
      startdate: {
        type: DATE,
      },
      enddate: {
        type: DATE,
      },
      givendate: {
        type: DATE,
      },
      studystartdate: {
        type: DATE,
      },
      graduated: {
        type: INTEGER,
      },
      // irtisanomisperuste
      student_studentnumber: {
        type: STRING,
        references: {
          model: 'student',
          key: 'studentnumber',
        },
      },
      faculty_code: {
        type: STRING,
      },
      prioritycode: {
        type: INTEGER,
      },
      extentcode: {
        type: INTEGER,
        references: {
          model: 'studyright_extents',
          key: 'extentcode',
        },
      },
      created_at: {
        type: DATE,
      },
      updated_at: {
        type: DATE,
      },
    })
  },
  down: async () => {},
}
