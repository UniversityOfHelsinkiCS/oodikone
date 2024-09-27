/* eslint-disable import/no-cycle */
import { InferAttributes } from 'sequelize'
import { Column, CreatedAt, DataType, ForeignKey, Model, PrimaryKey, Table, UpdatedAt } from 'sequelize-typescript'

import { Course } from './course'
import { Organization } from './organization'

@Table({
  underscored: true,
  modelName: 'course_provider',
  tableName: 'course_providers',
})
export class CourseProvider extends Model<InferAttributes<CourseProvider>> {
  @PrimaryKey
  @Column(DataType.STRING)
  composite!: string

  @ForeignKey(() => Course)
  @Column(DataType.STRING)
  coursecode!: string

  @Column(DataType.JSONB)
  shares!: Array<{ share: number; startDate?: string; endDate?: string }> | null

  @ForeignKey(() => Organization)
  @Column(DataType.STRING)
  organizationcode!: string

  @CreatedAt
  @Column(DataType.DATE)
  createdAt!: Date

  @UpdatedAt
  @Column(DataType.DATE)
  updatedAt!: Date
}
