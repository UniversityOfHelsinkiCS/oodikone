const { Model, DATE, ARRAY, STRING, INTEGER } = require('sequelize')
const { dbConnections } = require('../database/connection')

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
    studyrightid: {
      type: STRING,
      references: {
        model: 'studyright',
        key: 'studyrightid',
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
    sisu_id: {
      type: STRING,
    },
    completed_credits: {
      type: INTEGER,
    },
    curriculum_period_id: {
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
