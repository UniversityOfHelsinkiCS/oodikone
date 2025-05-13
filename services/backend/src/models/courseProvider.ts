import { Column, CreatedAt, DataType, ForeignKey, Model, Table, UpdatedAt } from 'sequelize-typescript'

import type { CourseProvider } from '@oodikone/shared/models'

import { CourseModel } from './course'
import { OrganizationModel } from './organization'

@Table({
  underscored: true,
  modelName: 'course_provider',
  tableName: 'course_providers',
})
export class CourseProviderModel extends Model<CourseProvider> implements CourseProvider {
  @ForeignKey(() => CourseModel)
  @Column(DataType.STRING)
  coursecode!: string

  @Column(DataType.JSONB)
  shares!: Array<{ share: number; startDate?: string; endDate?: string }> | null

  @ForeignKey(() => OrganizationModel)
  @Column(DataType.STRING)
  organizationcode!: string

  @CreatedAt
  @Column(DataType.DATE)
  createdAt!: Date

  @UpdatedAt
  @Column(DataType.DATE)
  updatedAt!: Date
}
