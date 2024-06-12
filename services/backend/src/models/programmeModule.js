const { Model, ARRAY, DATE, INTEGER, JSONB, STRING, TEXT } = require('sequelize')

const { dbConnections } = require('../database/connection')

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
    createdAt: {
      type: DATE,
    },
    updatedAt: {
      type: DATE,
    },
    degree_programme_type_urn: {
      type: STRING,
    },
  },
  {
    underscored: true,
    sequelize: dbConnections.sequelize,
    modelName: 'programme_module',
    tableName: 'programme_modules',
  }
)

module.exports = ProgrammeModule
