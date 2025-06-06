import { Model, ARRAY, BOOLEAN, DATE, INTEGER, JSONB, STRING } from 'sequelize'
import { sequelize } from '../connection.js'

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
    expirationRuleUrns: ARRAY(STRING),
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

export default SISStudyRight
