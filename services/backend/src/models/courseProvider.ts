import { Model, Table, Column, PrimaryKey, DataType, ForeignKey } from 'sequelize-typescript'
import { Organization } from './organization'
import { Course } from './course'

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
