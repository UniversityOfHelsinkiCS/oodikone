import { Column, DataType, ForeignKey, Model, PrimaryKey, Table } from 'sequelize-typescript'

import type { StudyplanCourse } from '@oodikone/shared/models'

import { CourseModel } from './course'
import { StudyplanModel } from './studyplan'

@Table({
  underscored: false,
  timestamps: false,
  modelName: 'studyplan_course',
  tableName: 'studyplan_course',
})
export class StudyplanCourseModel extends Model implements StudyplanCourse {
  @PrimaryKey
  @ForeignKey(() => StudyplanModel)
  @Column(DataType.STRING)
  declare studyplan_id: StudyplanCourse['studyplan_id']

  @PrimaryKey
  @ForeignKey(() => CourseModel)
  @Column(DataType.STRING)
  declare course_id: StudyplanCourse['course_id']
}
