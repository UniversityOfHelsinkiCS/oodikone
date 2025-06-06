import { Model, ARRAY, DATE, INTEGER, JSONB, STRING, TEXT } from 'sequelize'

import { sequelize } from '../connection.js'

class ProgrammeModule extends Model {}

ProgrammeModule.init(
  {
    id: {
      primaryKey: true,
      type: STRING,
    },
    group_id: {
      type: STRING,
    },
    code: {
      type: STRING,
    },
    name: {
      type: JSONB,
    },
    type: {
      type: STRING,
    },
    order: {
      type: INTEGER,
    },
    studyLevel: {
      type: STRING,
    },
    organization_id: {
      type: STRING,
      references: {
        model: 'organization',
        key: 'id',
      },
    },
    valid_from: {
      type: DATE,
    },
    valid_to: {
      type: DATE,
    },
    curriculum_period_ids: {
      type: ARRAY(TEXT),
    },
    degreeProgrammeType: {
      type: STRING,
    },
    minimumCredits: {
      type: INTEGER,
    },
    createdAt: {
      type: DATE,
    },
    updatedAt: {
      type: DATE,
    },
  },
  {
    underscored: true,
    sequelize,
    modelName: 'programme_module',
    tableName: 'programme_modules',
  }
)

export default ProgrammeModule
