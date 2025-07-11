import { Model, BOOLEAN, DATE, INTEGER, STRING } from 'sequelize'

import { sequelize } from '../connection.js'

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
    studyright_id: {
      type: STRING,
      allowNull: true,
    },
  },
  {
    underscored: false,
    sequelize,
    modelName: 'enrollment',
    tableName: 'enrollment',
  }
)

export default Enrollment
