const { Model, DATE, INTEGER, STRING, BOOLEAN } = require('sequelize')
const { dbConnections } = require('../database/connection')

class Enrollment extends Model {}

Enrollment.init(
  {
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
    semestercode: {
      type: INTEGER,
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
  },
  {
    underscored: false,
    sequelize: dbConnections.sequelize,
    modelName: 'enrollment',
    tableName: 'enrollment',
  }
)

module.exports = Enrollment
