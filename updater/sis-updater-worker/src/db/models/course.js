const { Model, STRING, DATE, JSONB, BOOLEAN } = require('sequelize')
const { dbConnections } = require('../connection')

class Course extends Model {}

Course.init(
  {
    id: {
      type: STRING,
      primaryKey: true,
    },
    code: {
      type: STRING,
    },
    name: {
      type: JSONB,
    },
    latest_instance_date: {
      type: DATE,
    },
    is_study_module: {
      type: BOOLEAN,
    },
    coursetypecode: {
      type: STRING,
    },
    startdate: {
      type: DATE,
    },
    enddate: {
      type: DATE,
    },
    max_attainment_date: {
      type: DATE,
    },
    min_attainment_date: {
      type: DATE,
    },
    createdAt: {
      field: 'created_at',
      type: DATE,
    },
    updatedAt: {
      field: 'updated_at',
      type: DATE,
    },
    substitutions: {
      type: JSONB,
    },
    course_unit_type: {
      type: STRING,
    },
    mainCourseCode: {
      field: 'main_course_code',
      type: STRING,
    },
  },
  {
    underscored: false,
    sequelize: dbConnections.sequelize,
    modelName: 'course',
    tableName: 'course',
  }
)

module.exports = Course
