import { Column, CreatedAt, DataType, ForeignKey, Model, Table, UpdatedAt } from 'sequelize-typescript'

import type { CourseProvider } from '@oodikone/shared/models'

import { OrganizationModel } from './organization'

@Table({
  underscored: true,
  modelName: 'course_provider',
  tableName: 'course_providers',
})
export class CourseProviderModel extends Model implements CourseProvider {
  @Column(DataType.STRING)
  declare courseGroupId: CourseProvider['courseGroupId']

  @Column(DataType.JSONB)
  declare shares: CourseProvider['shares']

  @ForeignKey(() => OrganizationModel)
  @Column(DataType.STRING)
  declare organizationId: CourseProvider['organizationId']

  @CreatedAt
  @Column(DataType.DATE)
  declare createdAt: CourseProvider['createdAt']

  @UpdatedAt
  @Column(DataType.DATE)
  declare updatedAt: CourseProvider['updatedAt']
}
