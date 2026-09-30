import { Model, DATE, INTEGER, JSONB, STRING } from 'sequelize'

import { dbConnections } from '../connection'

class Semester extends Model {
  [key: string]: any
}

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
    sequelize: dbConnections.sequelize,
    modelName: 'semester',
    tableName: 'semesters',
  }
)

export default Semester
