import { Column, DataType, Model, PrimaryKey, Table, AutoIncrement, Default } from 'sequelize-typescript'

import type { ExcludedCourse } from '@oodikone/shared/models/kone'

@Table({
  underscored: true,
  modelName: 'excluded_course',
  tableName: 'excluded_courses',
})
export class ExcludedCourseModel extends Model implements ExcludedCourse {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: ExcludedCourse['id']

  @Column(DataType.STRING)
  declare programme_code: ExcludedCourse['programme_code']

  @Column(DataType.STRING)
  declare course_code: ExcludedCourse['course_code']

  @Column(DataType.STRING)
  declare curriculum_version: ExcludedCourse['curriculum_version']

  @Default(DataType.NOW)
  @Column(DataType.DATE)
  declare createdAt: ExcludedCourse['createdAt']

  @Default(DataType.NOW)
  @Column(DataType.DATE)
  declare updatedAt: ExcludedCourse['updatedAt']
}
