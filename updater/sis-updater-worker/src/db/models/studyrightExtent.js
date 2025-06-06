import { Model, DATE, INTEGER, JSONB } from 'sequelize'

import { sequelize } from '../connection.js'

class StudyrightExtent extends Model {}

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
    sequelize,
    modelName: 'studyright_extent',
    tableName: 'studyright_extents',
  }
)

export default StudyrightExtent
