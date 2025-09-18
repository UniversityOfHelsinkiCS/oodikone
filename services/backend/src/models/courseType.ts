import { Column, CreatedAt, DataType, HasMany, Model, PrimaryKey, Table, UpdatedAt } from 'sequelize-typescript'

import type { CourseType } from '@oodikone/shared/models'

import { CourseModel } from './course'

@Table({
  underscored: true,
  modelName: 'course_type',
  tableName: 'course_types',
})
export class CourseTypeModel extends Model implements CourseType {
  @PrimaryKey
  @Column(DataType.STRING)
  declare coursetypecode: CourseType['coursetypecode']

  @HasMany(() => CourseModel)
  declare courses: CourseType['courses']

  @Column(DataType.JSONB)
  declare name: CourseType['name']

  @CreatedAt
  @Column(DataType.DATE)
  declare createdAt: CourseType['createdAt']

  @UpdatedAt
  @Column(DataType.DATE)
  declare updatedAt: CourseType['updatedAt']
}
