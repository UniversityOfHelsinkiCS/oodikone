const { Model, STRING, DATE, JSONB, INTEGER } = require('sequelize')
const { dbConnections } = require('../connection')

class Semester extends Model {}

Semester.init(
  {
    semestercode: {
      type: INTEGER,
      primaryKey: true
    },
    name: {
      type: JSONB
    },
    startdate: {
      type: DATE
    },
    enddate: {
      type: DATE
    },
    yearcode: {
      type: INTEGER,
      primaryKey: true
    },
    org: {
      type: STRING,
      primaryKey: true
    },
    yearname: {
      type: STRING
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
    modelName: 'semester',
    tableName: 'semesters'
  }
)

module.exports = Semester
