const { Model, ARRAY, DATE, DOUBLE, STRING, TEXT } = require('sequelize')

const { dbConnections } = require('../connection')

class Studyplan extends Model {}

Studyplan.init(
  {
    id: {
      primaryKey: true,
      type: STRING,
      allowNull: false,
    },
    studentnumber: {
      type: STRING,
      references: {
        model: 'student',
        key: 'studentnumber',
      },
      onUpdate: 'cascade',
      onDelete: 'cascade',
      allowNull: false,
    },
    programme_code: {
      type: STRING,
      allowNull: false,
    },
    included_courses: {
      type: ARRAY(STRING),
    },
    includedModules: {
      type: ARRAY(TEXT),
      field: 'included_modules',
    },
    sisu_id: {
      type: STRING,
    },
    completed_credits: {
      type: DOUBLE,
    },
    curriculum_period_id: {
      type: STRING,
    },
    sis_study_right_id: {
      type: STRING,
    },
    createdAt: {
      type: DATE,
    },
    updatedAt: {
      type: DATE,
    },
  },
  {
    underscored: false,
    sequelize: dbConnections.sequelize,
    modelName: 'studyplan',
    tableName: 'studyplan',
  }
)

module.exports = Studyplan
