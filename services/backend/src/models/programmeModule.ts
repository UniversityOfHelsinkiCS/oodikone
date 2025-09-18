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

import { OrganizationModel } from './organization'
import { ProgrammeModuleChildModel } from './programmeModuleChild'

@Table({
  underscored: true,
  modelName: 'programme_module',
  tableName: 'programme_modules',
})
export class ProgrammeModuleModel extends Model implements ProgrammeModule {
  @PrimaryKey
  @Column(DataType.STRING)
  declare id: ProgrammeModule['id']

  @BelongsToMany(() => ProgrammeModuleModel, () => ProgrammeModuleChildModel, 'child_id')
  declare parents: ProgrammeModule[]

  @BelongsToMany(() => ProgrammeModuleModel, () => ProgrammeModuleChildModel, 'parent_id')
  declare children: ProgrammeModule[]

  @BelongsTo(() => OrganizationModel, { foreignKey: 'organization_id' })
  declare organization: Organization

  @Column(DataType.STRING)
  declare group_id: ProgrammeModule['group_id']

  @Column(DataType.STRING)
  declare code: ProgrammeModule['code']

  @Column(DataType.JSONB)
  declare name: ProgrammeModule['name']

  @Column(DataType.STRING)
  declare type: ProgrammeModule['type']

  @Column(DataType.INTEGER)
  declare order: ProgrammeModule['order']

  @Column(DataType.STRING)
  declare studyLevel: ProgrammeModule['studyLevel']

  @ForeignKey(() => OrganizationModel)
  @Column(DataType.STRING)
  declare organization_id: ProgrammeModule['organization_id']

  @Column(DataType.DATE)
  declare valid_from: ProgrammeModule['valid_from']

  @Column(DataType.DATE)
  declare valid_to: ProgrammeModule['valid_to']

  @Column(DataType.ARRAY(DataType.STRING))
  declare curriculum_period_ids: ProgrammeModule['curriculum_period_ids']

  @Column(DataType.STRING)
  declare degreeProgrammeType: ProgrammeModule['degreeProgrammeType']

  @Column(DataType.INTEGER)
  declare minimumCredits: ProgrammeModule['minimumCredits']

  @CreatedAt
  @Column(DataType.DATE)
  declare createdAt: ProgrammeModule['createdAt']

  @UpdatedAt
  @Column(DataType.DATE)
  declare updatedAt: ProgrammeModule['updatedAt']
}
