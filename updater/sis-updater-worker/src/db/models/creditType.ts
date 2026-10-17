import { Model, DATE, INTEGER, JSONB } from 'sequelize'

import { dbConnections } from '../connection'

class CreditType extends Model {
  [key: string]: any
}

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

export default CreditType
