const { Model, DATE, JSONB, STRING } = require('sequelize')

const { dbConnections } = require('../connection')

class CourseProvider extends Model {}

CourseProvider.init(
  {
    composite: {
      type: STRING,
      primaryKey: true,
    },
    coursecode: {
      type: STRING,
      references: {
        model: 'course',
        key: 'id',
      },
      onUpdate: 'cascade',
      onDelete: 'cascade',
    },
    shares: {
      type: JSONB,
    },
    organizationcode: {
      type: STRING,
      references: {
        model: 'organization',
        key: 'id',
      },
      onUpdate: 'cascade',
      onDelete: 'cascade',
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
    modelName: 'course_provider',
    tableName: 'course_providers',
  }
)

module.exports = CourseProvider
