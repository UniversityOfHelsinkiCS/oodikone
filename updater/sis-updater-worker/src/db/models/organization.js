import { Model, DATE, JSONB, STRING } from 'sequelize'

import { sequelize } from '../connection.js'

class Organization extends Model {}

Organization.init(
  {
    id: {
      type: STRING,
      primaryKey: true,
    },
    code: {
      type: STRING,
      references: {
        table: 'organization',
        field: 'code',
      },
    },
    name: {
      type: JSONB,
    },
    parent_id: {
      type: STRING,
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
    modelName: 'organization',
    tableName: 'organization',
  }
)

export default Organization
