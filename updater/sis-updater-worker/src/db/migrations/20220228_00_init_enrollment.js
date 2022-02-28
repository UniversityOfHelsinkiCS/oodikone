const { STRING, DATE, INTEGER, BOOLEAN } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.createTable('enrollment', {
      id: {
        primaryKey: true,
        type: STRING,
      },
      studentnumber: {
        type: STRING,
        references: {
          model: 'student',
          key: 'studentnumber',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
      },
      semestercode: {
        type: INTEGER,
      },
      course_code: {
        type: STRING,
      },
      state: {
        type: STRING,
      },
      enrollment_date_time: {
        type: DATE,
      },
      course_id: {
        type: STRING,
        references: {
          model: 'course',
          key: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
      },
      semester_composite: {
        type: STRING,
        references: {
          model: 'semesters',
          key: 'composite',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
      },
      createdAt: {
        type: DATE,
      },
      updatedAt: {
        type: DATE,
      },
      is_open: {
        type: BOOLEAN,
      },
    })
  },
  down: async () => {},
}
