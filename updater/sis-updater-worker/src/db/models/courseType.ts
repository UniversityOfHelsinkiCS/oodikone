import { Model, DATE, JSONB, STRING } from 'sequelize'

import { dbConnections } from '../connection'

class CourseType extends Model {
  [key: string]: any
}

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

export default CourseType
