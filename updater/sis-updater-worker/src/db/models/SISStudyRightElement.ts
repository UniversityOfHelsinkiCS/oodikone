import { Model, BOOLEAN, DATE, INTEGER, JSONB, STRING } from 'sequelize'

import { dbConnections } from '../connection'

class SISStudyRightElement extends Model {
  [key: string]: any
}

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
    studyTrack: JSONB,
    degreeProgrammeType: STRING,
    createdAt: DATE,
    updatedAt: DATE,
  },
  {
    underscored: true,
    sequelize: dbConnections.sequelize,
    tableName: 'sis_study_right_elements',
  }
)

export default SISStudyRightElement
