import { BelongsTo, BelongsToMany, Column, Model, DataType, PrimaryKey, Table } from 'sequelize-typescript'

import { Organization } from './organization'
import { ProgrammeModuleChild } from './programmeModuleChild'

@Table({
  underscored: true,
  modelName: 'programme_module',
  tableName: 'programme_modules',
})
export class ProgrammeModule extends Model {
  @PrimaryKey
  @Column(DataType.STRING)
  id: string

  @BelongsTo(() => Organization, { foreignKey: 'organization_id' })
  organization: Organization

  @BelongsToMany(() => ProgrammeModule, () => ProgrammeModuleChild, 'child_id')
  parents: ProgrammeModule[]

  @BelongsToMany(() => ProgrammeModule, () => ProgrammeModuleChild, 'parent_id')
  children: ProgrammeModule[]

  @Column(DataType.STRING)
  group_id: string

  @Column(DataType.STRING)
  code: string

  @Column(DataType.JSONB)
  name: object

  @Column(DataType.STRING)
  type: string

  @Column(DataType.INTEGER)
  order: number

  @Column(DataType.STRING)
  studyLevel: string

  @Column(DataType.STRING)
  organization_id: string

  @Column(DataType.DATE)
  valid_from: Date

  @Column(DataType.DATE)
  valid_to: Date

  @Column(DataType.ARRAY(DataType.STRING))
  curriculum_period_ids: string[]

  @Column(DataType.DATE)
  createdAt: Date

  @Column(DataType.DATE)
  updatedAt: Date
}
