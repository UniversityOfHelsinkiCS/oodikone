const { Model, DATE, INTEGER, JSONB } = require('sequelize')

const { dbConnections } = require('../database/connection')

class CreditType extends Model {}

CreditType.init(
  {
    credittypecode: {
      primaryKey: true,
      type: INTEGER,
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
    underscored: true,
    sequelize: dbConnections.sequelize,
    modelName: 'credit_type',
    tableName: 'credit_types',
  }
)

module.exports = CreditType
