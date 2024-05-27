const { Model, DATE, JSONB, STRING } = require('sequelize')

const { dbConnections } = require('../database/connection')

class CourseType extends Model {}

CourseType.init(
  {
    coursetypecode: {
      type: STRING,
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
    underscored: true,
    sequelize: dbConnections.sequelize,
    modelName: 'course_type',
    tableName: 'course_types',
  }
)

module.exports = CourseType
