import { Model, ARRAY, BOOLEAN, DATE, INTEGER, JSONB, STRING } from 'sequelize'
import { dbConnections } from '../connection'

class SISStudyRight extends Model {
  [key: string]: any
}

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
    transferInfo: JSONB,
    facultyCode: STRING,
    expirationRuleUrns: ARRAY(STRING),
    tvex: BOOLEAN,
    createdAt: DATE,
    updatedAt: DATE,
  },
  {
    underscored: true,
    sequelize: dbConnections.sequelize,
    tableName: 'sis_study_rights',
  }
)

export default SISStudyRight
