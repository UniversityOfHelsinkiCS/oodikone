import { Model, DATE, JSONB, STRING } from 'sequelize'

import { dbConnections } from '../connection'

class Organization extends Model {
  [key: string]: any
}

Organization.init(
  {
    id: {
      type: STRING,
      primaryKey: true,
    },
    code: {
      type: STRING,
      references: {
        // @ts-expect-error FIXME: These fields acually don't exist. They most likely should be "model" and "key"
        // but that doesn't make any sense: Foreign key to itself with "code" as key.
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
    sequelize: dbConnections.sequelize,
    modelName: 'organization',
    tableName: 'organization',
  }
)

export default Organization
