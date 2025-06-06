import { Model, BOOLEAN, DATE, INTEGER, JSONB, STRING } from 'sequelize'

import { sequelize } from '../connection.js'

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
    studyTrack: JSONB,
    degreeProgrammeType: STRING,
    createdAt: DATE,
    updatedAt: DATE,
  },
  {
    underscored: true,
    sequelize,
    tableName: 'sis_study_right_elements',
  }
)

export default SISStudyRightElement
