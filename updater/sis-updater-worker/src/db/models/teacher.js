const { Model, STRING, DATE } = require('sequelize')

const { dbConnections } = require('../connection')

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
    sequelize: dbConnections.sequelize,
    modelName: 'teacher',
    tableName: 'teacher',
  }
)

module.exports = Teacher
