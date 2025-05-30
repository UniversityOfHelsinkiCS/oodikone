const { Model, BOOLEAN, DATE, INTEGER, JSONB, STRING } = require('sequelize')

const {
  dbConnections: { sequelize },
} = require('../connection')

class SISStudyRight extends Model {}

SISStudyRight.init(
  {
    id: {
      type: STRING,
      primaryKey: true,
    },
    startDate: DATE,
    endDate: DATE,
    studyStartDate: DATE,
    cancelled: BOOLEAN,
    studentNumber: STRING,
    extentCode: INTEGER,
    admissionType: STRING,
    semesterEnrollments: JSONB,
    facultyCode: STRING,
    tvex: BOOLEAN,
    createdAt: DATE,
    updatedAt: DATE,
  },
  {
    underscored: true,
    sequelize,
    tableName: 'sis_study_rights',
  }
)

module.exports = SISStudyRight
