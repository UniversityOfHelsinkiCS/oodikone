import { Column, DataType, ForeignKey, Model, PrimaryKey, Table } from 'sequelize-typescript'

import { Course } from './course'
import { Organization } from './organization'

@Table({
  underscored: true,
  modelName: 'course_provider',
  tableName: 'course_providers',
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

  @Column(DataType.DATE)
  createdAt: Date

  @Column(DataType.DATE)
  updatedAt: Date
}
