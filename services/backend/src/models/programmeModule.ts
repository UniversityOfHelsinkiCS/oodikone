import { InferAttributes } from 'sequelize'
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

import { Name } from '@oodikone/shared/types'
import { DegreeProgrammeType } from '../types'
import { Organization } from './organization'
import { ProgrammeModuleChild } from './programmeModuleChild'

@Table({
  underscored: true,
  modelName: 'programme_module',
  tableName: 'programme_modules',
})
export class ProgrammeModule extends Model<InferAttributes<ProgrammeModule>> {
  @PrimaryKey
  @Column(DataType.STRING)
  id!: string

  @BelongsToMany(() => ProgrammeModule, () => ProgrammeModuleChild, 'child_id')
  parents!: ProgrammeModule[]

  @BelongsToMany(() => ProgrammeModule, () => ProgrammeModuleChild, 'parent_id')
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

  @ForeignKey(() => Organization)
  @Column(DataType.STRING)
  organization_id!: string

  @BelongsTo(() => Organization, { foreignKey: 'organization_id' })
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
