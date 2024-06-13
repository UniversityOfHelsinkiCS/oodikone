const { Model, DATE, INTEGER, JSONB, STRING } = require('sequelize')

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
    degree_programme_type_urn: {
      type: STRING,
    },
    education_type: {
      type: STRING,
    },
  },
  {
    sequelize: dbConnections.sequelize,
    modelName: 'element_detail',
    tableName: 'element_details',
  }
)

module.exports = ElementDetail
