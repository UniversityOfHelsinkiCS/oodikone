import { Model, DATE, JSONB, STRING } from 'sequelize'

import { dbConnections } from '../connection'

class CourseProvider extends Model {
  [key: string]: any
}

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
    sequelize: dbConnections.sequelize,
    modelName: 'course_provider',
    tableName: 'course_providers',
  }
)

export default CourseProvider
