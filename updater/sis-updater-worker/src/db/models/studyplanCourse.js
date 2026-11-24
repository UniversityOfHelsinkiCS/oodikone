import { Model, STRING } from 'sequelize'

import { dbConnections } from '../connection.js'

class StudyplanCourse extends Model {}

StudyplanCourse.init(
  {
    studyplan_id: {
      primaryKey: true,
      type: STRING,
      references: {
        model: 'studyplan',
        key: 'id',
      },
      onUpdate: 'cascade',
      onDelete: 'cascade',
      allowNull: false,
    },
    course_id: {
      primaryKey: true,
      type: STRING,
      allowNull: false,
    },
  },
  {
    underscored: false,
    timestamps: false,
    sequelize: dbConnections.sequelize,
    modelName: 'studyplan_course',
    tableName: 'studyplan_course',
  }
)

export default StudyplanCourse
