import { Model, DATE, JSONB, STRING } from 'sequelize'

import { sequelize } from '../connection.js'

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
    sequelize,
    modelName: 'course_type',
    tableName: 'course_types',
  }
)

export default CourseType
