import { Model, DATE, INTEGER, JSONB } from 'sequelize'

import { dbConnections } from '../connection'

class StudyrightExtent extends Model {
  [key: string]: any
}

StudyrightExtent.init(
  {
    extentcode: {
      type: INTEGER,
      primaryKey: true,
    },
    name: {
      type: JSONB,
    },
    createdAt: {
      type: DATE,
    },
    updatedAt: {
      type: DATE,
    },
  },
  {
    sequelize: dbConnections.sequelize,
    modelName: 'studyright_extent',
    tableName: 'studyright_extents',
  }
)

export default StudyrightExtent
