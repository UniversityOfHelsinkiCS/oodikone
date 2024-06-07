const { Model, BOOLEAN, DATE, INTEGER, JSONB, STRING } = require('sequelize')

const {
  dbConnections: { sequelize },
} = require('../connection')

class SISStudyRightElement extends Model {}

SISStudyRightElement.init(
  {
    id: {
      type: STRING,
      primaryKey: true,
    },
    startDate: DATE,
    endDate: DATE,
    graduated: BOOLEAN,
    phase: INTEGER,
    studyRightId: STRING,
    code: STRING,
    name: JSONB,
    studyTracks: JSONB,
    facultyCode: STRING,
    createdAt: DATE,
    updatedAt: DATE,
  },
  {
    underscored: true,
    sequelize,
    tableName: 'sis_study_right_elements',
  }
)

module.exports = SISStudyRightElement
