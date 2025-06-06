import { Model, DATE, INTEGER, JSONB } from 'sequelize'

import { sequelize } from '../connection.js'

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
    sequelize,
    modelName: 'credit_type',
    tableName: 'credit_types',
  }
)

export default CreditType
