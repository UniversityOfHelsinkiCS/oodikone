import { Model, DATE, JSONB, STRING } from 'sequelize'

import { dbConnections } from '../connection.js'

class CourseProvider extends Model {}

CourseProvider.init(
  {
    courseGroupId: {
      type: STRING,
    },
    shares: {
      type: JSONB,
    },
    organizationId: {
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

export default CourseProvider
