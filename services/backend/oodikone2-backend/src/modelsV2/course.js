const { Model, STRING, DATE, JSONB, BOOLEAN } = require('sequelize')
const { dbConnections } = require('../databaseV2/connection')

class Course extends Model {}

Course.init(
  {
    id: {
      type: STRING,
      primaryKey: true
    },
    code: {
      type: STRING
    },
    name: {
      type: JSONB
    },
    latestInstanceDate: {
      type: DATE
    },
    isStudyModule: {
      type: BOOLEAN
    },
    coursetypecode: {
      type: STRING
    },
    startdate: {
      type: DATE
    },
    enddate: {
      type: DATE
    },
    maxAttainmentDate: {
      type: DATE
    },
    minAttainmentDate: {
      type: DATE
    },
    createdAt: {
      type: DATE
    },
    updatedAt: {
      type: DATE
    }
  },
  {
    underscored: true,
    sequelize: dbConnections.sequelize,
    modelName: 'course',
    tableName: 'course'
  }
)

module.exports = Course
