/* eslint-disable import/no-cycle */
import { Column, CreatedAt, DataType, ForeignKey, Model, PrimaryKey, Table, UpdatedAt } from 'sequelize-typescript'

import { Course } from './course'
import { Organization } from './organization'

@Table({
  underscored: true,
  modelName: 'course_provider',
  tableName: 'course_providers',
  indexes: [
    {
      unique: true,
      fields: ['coursecode', 'organizationcode'],
    },
  ],
})
export class CourseProvider extends Model {
  @PrimaryKey
  @Column(DataType.STRING)
  composite: string

  @ForeignKey(() => Course)
  @Column(DataType.STRING)
  coursecode: string

  @Column(DataType.JSONB)
  shares: object

  @ForeignKey(() => Organization)
  @Column(DataType.STRING)
  organizationcode: string

  @CreatedAt
  @Column(DataType.DATE)
  createdAt: Date

  @UpdatedAt
  @Column(DataType.DATE)
  updatedAt: Date
}
