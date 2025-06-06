import { Model, DATE, INTEGER, JSONB, STRING } from 'sequelize'

import { sequelize } from '../connection.js'

class Semester extends Model {}

Semester.init(
  {
    composite: {
      type: STRING,
      primaryKey: true,
    },
    semestercode: {
      type: INTEGER,
    },
    name: {
      type: JSONB,
    },
    startdate: {
      type: DATE,
    },
    enddate: {
      type: DATE,
    },
    yearcode: {
      type: INTEGER,
    },
    org: {
      type: STRING,
    },
    yearname: {
      type: STRING,
    },
    termIndex: {
      type: INTEGER,
    },
    startYear: {
      type: INTEGER,
    },
    createdAt: {
      type: DATE,
    },
    updatedAt: {
      type: DATE,
    },
  },
  {
    underscored: true,
    sequelize,
    modelName: 'semester',
    tableName: 'semesters',
  }
)

export default Semester
