import { InferAttributes } from 'sequelize'
import { Column, CreatedAt, DataType, HasMany, Model, PrimaryKey, Table, UpdatedAt } from 'sequelize-typescript'

import { Name } from '@shared/types'
import { Course } from './course'

@Table({
  underscored: true,
  modelName: 'course_type',
  tableName: 'course_types',
})
export class CourseType extends Model<InferAttributes<CourseType>> {
  @PrimaryKey
  @Column(DataType.STRING)
  coursetypecode!: string

  @HasMany(() => Course)
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
