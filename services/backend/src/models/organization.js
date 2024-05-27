const { Model, DATE, JSONB, STRING } = require('sequelize')

const { dbConnections } = require('../database/connection')

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
    sequelize: dbConnections.sequelize,
    modelName: 'organization',
    tableName: 'organization',
  }
)

module.exports = Organization
