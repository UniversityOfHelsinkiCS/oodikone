import {
  BelongsToMany,
  Column,
  CreatedAt,
  DataType,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript'

import type { Organization, ProgrammeModule, SISStudyRight } from '@oodikone/shared/models'
import type { Name } from '@oodikone/shared/types'

import { CourseModel } from './course'
import { CourseProviderModel } from './courseProvider'
import { ProgrammeModuleModel } from './programmeModule'
import { SISStudyRightModel } from './SISStudyRight'

@Table({
  underscored: true,
  modelName: 'organization',
  tableName: 'organization',
})
export class OrganizationModel extends Model<Organization> implements Organization {
  @PrimaryKey
  @Column(DataType.STRING)
  id!: string

  @Column(DataType.STRING)
  code!: string

  @Column(DataType.JSONB)
  name!: Name

  @Column(DataType.STRING)
  parent_id!: string

  @HasMany(() => OrganizationModel, { foreignKey: 'parent_id', as: 'children' })
  children!: Organization[]

  @HasMany(() => ProgrammeModuleModel, { foreignKey: 'organization_id' })
  programmeModules!: ProgrammeModule[]

  @HasMany(() => SISStudyRightModel, { foreignKey: 'facultyCode', sourceKey: 'code' })
  SISStudyRights!: SISStudyRight[]

  @BelongsToMany(() => CourseModel, () => CourseProviderModel, 'organizationcode')
  courses!: CourseModel[]

  @CreatedAt
  @Column(DataType.DATE)
  createdAt!: Date

  @UpdatedAt
  @Column(DataType.DATE)
  updatedAt!: Date
}
