import {
  BelongsTo,
  BelongsToMany,
  Column,
  CreatedAt,
  ForeignKey,
  Model,
  DataType,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript'

import type { Organization, ProgrammeModule } from '@oodikone/shared/models'
import { DegreeProgrammeType, Name } from '@oodikone/shared/types'

import { OrganizationModel } from './organization'
import { ProgrammeModuleChildModel } from './programmeModuleChild'

@Table({
  underscored: true,
  modelName: 'programme_module',
  tableName: 'programme_modules',
})
export class ProgrammeModuleModel extends Model<ProgrammeModule> implements ProgrammeModule {
  @PrimaryKey
  @Column(DataType.STRING)
  id!: string

  @BelongsToMany(() => ProgrammeModuleModel, () => ProgrammeModuleChildModel, 'child_id')
  parents!: ProgrammeModule[]

  @BelongsToMany(() => ProgrammeModuleModel, () => ProgrammeModuleChildModel, 'parent_id')
  children!: ProgrammeModule[]

  @Column(DataType.STRING)
  group_id!: string

  @Column(DataType.STRING)
  code!: string

  @Column(DataType.JSONB)
  name!: Name

  @Column(DataType.STRING)
  type!: 'course' | 'module'

  @Column(DataType.INTEGER)
  order!: number

  @Column(DataType.STRING)
  studyLevel!: string

  @ForeignKey(() => OrganizationModel)
  @Column(DataType.STRING)
  organization_id!: string

  @BelongsTo(() => OrganizationModel, { foreignKey: 'organization_id' })
  organization!: Organization

  @Column(DataType.DATE)
  valid_from!: Date

  @Column(DataType.DATE)
  valid_to!: Date

  @Column(DataType.ARRAY(DataType.STRING))
  curriculum_period_ids!: string[]

  @Column(DataType.STRING)
  degreeProgrammeType!: DegreeProgrammeType | null

  @Column(DataType.INTEGER)
  minimumCredits!: number | null

  @CreatedAt
  @Column(DataType.DATE)
  createdAt!: Date

  @UpdatedAt
  @Column(DataType.DATE)
  updatedAt!: Date
}
