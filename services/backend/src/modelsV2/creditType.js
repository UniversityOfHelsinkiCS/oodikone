const { Model, INTEGER, DATE, JSONB } = require('sequelize')
const { dbConnections } = require('../databaseV2/connection')

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
