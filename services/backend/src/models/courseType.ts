import { Column, CreatedAt, DataType, HasMany, Model, PrimaryKey, Table, UpdatedAt } from 'sequelize-typescript'

import type { Course, CourseType } from '@oodikone/shared/models'

import { Name } from '@oodikone/shared/types'
import { CourseModel } from './course'

@Table({
  underscored: true,
  modelName: 'course_type',
  tableName: 'course_types',
})
export class CourseTypeModel extends Model<CourseType> implements CourseType {
  @PrimaryKey
  @Column(DataType.STRING)
  coursetypecode!: string

  @HasMany(() => CourseModel)
  courses!: Course[]

  @Column(DataType.JSONB)
  name!: Required<Name>

  @CreatedAt
  @Column(DataType.DATE)
  createdAt!: Date

  @UpdatedAt
  @Column(DataType.DATE)
  updatedAt!: Date
}
