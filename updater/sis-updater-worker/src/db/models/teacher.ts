import { Model, DATE, STRING } from 'sequelize'

import { dbConnections } from '../connection'

class Teacher extends Model {
  [key: string]: any
}

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
    sequelize: dbConnections.sequelize,
    modelName: 'teacher',
    tableName: 'teacher',
  }
)

export default Teacher
