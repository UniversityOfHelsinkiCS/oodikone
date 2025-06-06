import { Model, DATE, JSONB, STRING } from 'sequelize'

import { sequelize } from '../connection.js'

class CourseProvider extends Model {}

CourseProvider.init(
  {
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
    sequelize,
    modelName: 'course_provider',
    tableName: 'course_providers',
  }
)

export default CourseProvider
