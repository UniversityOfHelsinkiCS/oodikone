const { Model, INTEGER, STRING, DATE } = require('sequelize')
const { dbConnections } = require('../database/connection')

class ExcludedCourse extends Model {}

ExcludedCourse.init(
  {
    id: {
      primaryKey: true,
      type: INTEGER,
      autoIncrement: true,
    },
    programme_code: {
      type: STRING,
    },
    course_code: {
      type: STRING,
    },
    curriculum_version: {
      type: STRING,
    },
    created_at: {
      type: DATE,
    },
    updated_at: {
      type: DATE,
    },
  },
  {
    underscored: true,
    sequelize: dbConnections.sequelize,
    modelName: 'excluded_course',
    tableName: 'excluded_courses',
  }
)

module.exports = ExcludedCourse
