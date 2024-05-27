const { Model, BOOLEAN, DATE, INTEGER, STRING } = require('sequelize')

const { dbConnections } = require('../connection')

class SemesterEnrollment extends Model {}

SemesterEnrollment.init(
  {
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
    enrollment_date: {
      type: DATE,
    },
    statutory_absence: {
      type: BOOLEAN,
    },
    createdAt: {
      type: DATE,
    },
    updatedAt: {
      type: DATE,
    },
  },
  {
    underscored: false,
    sequelize: dbConnections.sequelize,
    modelName: 'semester_enrollment',
    tableName: 'semester_enrollments',
  }
)

module.exports = SemesterEnrollment
