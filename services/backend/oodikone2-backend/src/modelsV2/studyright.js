const { Model, STRING, DATE, INTEGER } = require('sequelize')
const { dbConnections } = require('../databaseV2/connection')

class Studyright extends Model {}

Studyright.init(
  {
    studyrightid: {
      primaryKey: true,
      type: STRING
    },
    canceldate: {
      type: DATE
    },
    startdate: {
      type: DATE
    },
    enddate: {
      type: DATE
    },
    givendate: {
      type: DATE
    },
    studystartdate: {
      type: DATE
    },
    graduated: {
      type: INTEGER
    },
    // irtisanomisperuste
    studentStudentnumber: {
      type: STRING
    },
    facultyCode: {
      type: STRING
    },
    prioritycode: {
      type: INTEGER
    },
    extentcode: {
      type: INTEGER
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
    modelName: 'studyright',
    tableName: 'studyright'
  }
)

module.exports = Studyright
