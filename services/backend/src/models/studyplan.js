const { Model, DATE, ARRAY, STRING, INTEGER } = require('sequelize')
const { dbConnections } = require('../database/connection')

class Studyplan extends Model {}

Studyplan.init(
  {
    id: {
      primaryKey: true,
      type: INTEGER,
      autoIncrement: true,
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
      unique: 'source', // This and programme_code create a composite key for this table.
      allowNull: false,
    },
    programme_code: {
      type: STRING,
      allowNull: false,
      unique: 'source',
    },
    included_courses: {
      type: ARRAY(STRING),
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
