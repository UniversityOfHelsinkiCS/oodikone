const { Model, STRING, DATE } = require('sequelize')
const { dbConnections } = require('../database/connection')

class CourseProvider extends Model {}

CourseProvider.init(
  {
    composite: {
      type: STRING,
      unique: true,
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
    indexes: [
      {
        unique: true,
        fields: ['coursecode', 'organizationcode'],
      },
    ],
  }
)

module.exports = CourseProvider
