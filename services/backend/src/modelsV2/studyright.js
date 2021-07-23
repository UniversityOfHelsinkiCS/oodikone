const { Model, STRING, DATE, INTEGER } = require('sequelize')
const { dbConnections } = require('../databaseV2/connection')

class Studyright extends Model {}

Studyright.init(
  {
    studyrightid: {
      primaryKey: true,
      type: STRING,
    },
    canceldate: {
      type: DATE,
    },
    startdate: {
      type: DATE,
    },
    enddate: {
      type: DATE,
    },
    givendate: {
      type: DATE,
    },
    studystartdate: {
      type: DATE,
    },
    graduated: {
      type: INTEGER,
    },
    // irtisanomisperuste
    studentStudentnumber: {
      type: STRING,
      references: {
        model: 'student',
        key: 'studentnumber',
      },
      onUpdate: 'cascade',
      onDelete: 'cascade',
    },
    facultyCode: {
      type: STRING,
    },
    prioritycode: {
      type: INTEGER,
    },
    extentcode: {
      type: INTEGER,
      references: {
        model: 'studyright_extents',
        key: 'extentcode',
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
    admissionType: {
      type: STRING,
    },
  },
  {
    underscored: true,
    sequelize: dbConnections.sequelize,
    modelName: 'studyright',
    tableName: 'studyright',
  }
)

module.exports = Studyright
