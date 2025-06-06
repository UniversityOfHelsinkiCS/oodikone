import { Model, DATE, STRING } from 'sequelize'

import { sequelize } from '../connection.js'

class Teacher extends Model {}

Teacher.init(
  {
    id: {
      primaryKey: true,
      type: STRING,
    },
    name: {
      type: STRING,
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
    modelName: 'teacher',
    tableName: 'teacher',
  }
)

export default Teacher
