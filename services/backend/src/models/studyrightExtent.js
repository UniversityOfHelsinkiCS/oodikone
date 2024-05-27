const { Model, DATE, INTEGER, JSONB } = require('sequelize')

const { dbConnections } = require('../database/connection')

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
    sequelize: dbConnections.sequelize,
    modelName: 'studyright_extent',
    tableName: 'studyright_extents',
  }
)

module.exports = StudyrightExtent
