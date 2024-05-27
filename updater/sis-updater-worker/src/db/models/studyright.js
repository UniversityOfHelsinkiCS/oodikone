const { Model, BOOLEAN, DATE, INTEGER, JSONB, STRING } = require('sequelize')

const { dbConnections } = require('../connection')

class Studyright extends Model {}

Studyright.init(
  {
    studyrightid: {
      primaryKey: true,
      type: STRING,
    },
    actual_studyrightid: {
      type: STRING,
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
    active: {
      type: INTEGER,
    },
    cancelled: {
      type: BOOLEAN,
    },
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
    isBaMa: {
      type: BOOLEAN,
    },
    semesterEnrollments: {
      type: JSONB,
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
