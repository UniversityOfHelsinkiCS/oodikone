/* eslint-disable import/no-cycle */
import { Column, CreatedAt, DataType, HasMany, Model, PrimaryKey, Table, UpdatedAt } from 'sequelize-typescript'

import { Course } from './course'

@Table({
  underscored: true,
  modelName: 'course_type',
  tableName: 'course_types',
})
export class CourseType extends Model {
  @PrimaryKey
  @Column(DataType.STRING)
  coursetypecode: string

  @HasMany(() => Course)
  courses: Course[]

  @Column(DataType.JSONB)
  name: object

  @CreatedAt
  @Column(DataType.DATE)
  createdAt: Date

  @UpdatedAt
  @Column(DataType.DATE)
  updatedAt: Date
}
