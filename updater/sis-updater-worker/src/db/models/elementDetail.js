const { Model, INTEGER, DATE, JSONB, STRING } = require('sequelize')

const { dbConnections } = require('../connection')

class ElementDetail extends Model {}

ElementDetail.init(
  {
    code: { type: STRING, primaryKey: true },
    name: { type: JSONB },
    type: { type: INTEGER },
    createdAt: {
      type: DATE,
    },
    updatedAt: {
      type: DATE,
    },
  },
  {
    sequelize: dbConnections.sequelize,
    modelName: 'element_detail',
    tableName: 'element_details',
  }
)

module.exports = ElementDetail
