import { Column, CreatedAt, DataType, ForeignKey, Model, PrimaryKey, Table, UpdatedAt } from 'sequelize-typescript'

import type { ProgrammeModuleChild } from '@oodikone/shared/models'

import { ProgrammeModuleModel } from './programmeModule'

@Table({
  underscored: true,
  modelName: 'programme_module_child',
  tableName: 'programme_module_children',
})
export class ProgrammeModuleChildModel extends Model<ProgrammeModuleChild> implements ProgrammeModuleChild {
  @PrimaryKey
  @Column(DataType.STRING)
  composite!: string

  @ForeignKey(() => ProgrammeModuleModel)
  @Column(DataType.STRING)
  parentId!: string

  @Column(DataType.STRING)
  childId!: string

  @CreatedAt
  @Column(DataType.DATE)
  createdAt!: Date

  @UpdatedAt
  @Column(DataType.DATE)
  updatedAt!: Date
}
