import { Column, CreatedAt, DataType, ForeignKey, Model, PrimaryKey, Table, UpdatedAt } from 'sequelize-typescript'

import type { ProgrammeModuleChild } from '@oodikone/shared/models'

import { ProgrammeModuleModel } from './programmeModule'

@Table({
  underscored: true,
  modelName: 'programme_module_child',
  tableName: 'programme_module_children',
})
export class ProgrammeModuleChildModel extends Model implements ProgrammeModuleChild {
  @PrimaryKey
  @Column(DataType.STRING)
  declare composite: ProgrammeModuleChild['composite']

  @ForeignKey(() => ProgrammeModuleModel)
  @Column(DataType.STRING)
  declare parentId: ProgrammeModuleChild['parentId']

  @Column(DataType.STRING)
  declare childId: ProgrammeModuleChild['childId']

  @CreatedAt
  @Column(DataType.DATE)
  declare createdAt: ProgrammeModuleChild['createdAt']

  @UpdatedAt
  @Column(DataType.DATE)
  declare updatedAt: ProgrammeModuleChild['updatedAt']
}
