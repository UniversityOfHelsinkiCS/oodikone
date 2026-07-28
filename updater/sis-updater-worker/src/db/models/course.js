import { Model, BOOLEAN, DATE, JSONB, STRING } from 'sequelize'

import { dbConnections } from '../connection.js'

class Course extends Model {}

Course.init(
  {
    id: {
      type: STRING,
      primaryKey: true,
    },
    groupId: {
      type: STRING,
    },
    code: {
      type: STRING,
    },
    name: {
      type: JSONB,
    },
    isStudyModule: {
      type: BOOLEAN,
    },
    isPrimary: {
      type: BOOLEAN,
    },
    coursetypecode: {
      type: STRING,
    },
    maxAttainmentDate: {
      type: DATE,
    },
    minAttainmentDate: {
      type: DATE,
    },
    createdAt: {
      field: 'created_at',
      type: DATE,
    },
    updatedAt: {
      field: 'updated_at',
      type: DATE,
    },
    substitutionGroups: {
      type: JSONB,
    },
    validityPeriod: {
      type: JSONB,
    },
    courseUnitType: {
      type: STRING,
    },
  },
  {
    underscored: true,
    sequelize: dbConnections.sequelize,
    modelName: 'course',
    tableName: 'course',
  }
)

export default Course
