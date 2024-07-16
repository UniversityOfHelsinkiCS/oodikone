/* eslint-disable import/no-cycle */
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

  @ForeignKey(() => Organization)
  @Column(DataType.STRING)
  organization_id: string

  @BelongsTo(() => Organization)
  organization: Organization

  @Column(DataType.DATE)
  valid_from: Date

  @Column(DataType.DATE)
  valid_to: Date

  @Column(DataType.ARRAY(DataType.STRING))
  curriculum_period_ids: string[]

  @Column(DataType.STRING)
  degreeProgrammeType: string

  @CreatedAt
  @Column(DataType.DATE)
  createdAt: Date

  @UpdatedAt
  @Column(DataType.DATE)
  updatedAt: Date
}
