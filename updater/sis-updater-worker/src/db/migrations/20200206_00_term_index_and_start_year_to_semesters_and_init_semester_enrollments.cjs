const { DATE, INTEGER, STRING, BOOLEAN } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await Promise.all([
      queryInterface.createTable('semester_enrollments', {
        enrollmenttype: {
          type: INTEGER,
        },
        org: {
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
          primaryKey: true,
        },
        semestercode: {
          type: INTEGER,
        },
        semestercomposite: {
          type: STRING,
          references: {
            model: 'semesters',
            key: 'composite',
          },
          onUpdate: 'cascade',
          onDelete: 'cascade',
          primaryKey: true,
        },
        statutory_absence: {
          type: BOOLEAN,
        },
        enrollment_date: {
          type: DATE,
        },
        createdAt: {
          type: DATE,
        },
        updatedAt: {
          type: DATE,
        },
      }),
      queryInterface.addColumn('semesters', 'term_index', INTEGER),
      queryInterface.addColumn('semesters', 'start_year', INTEGER),
    ])
  },
  down: async () => {},
}
