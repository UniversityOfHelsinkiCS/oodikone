const { Model, DATE, STRING } = require('sequelize')

const { dbConnections } = require('../database/connection')

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
