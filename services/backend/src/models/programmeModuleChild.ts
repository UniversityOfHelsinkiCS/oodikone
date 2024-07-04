import { Column, DataType, ForeignKey, Model, PrimaryKey, Table } from 'sequelize-typescript'

import { ProgrammeModule } from './programmeModule'

@Table({
  underscored: true,
  modelName: 'programme_module_child',
  tableName: 'programme_module_children',
})
export class ProgrammeModuleChild extends Model {
  @PrimaryKey
  @Column(DataType.STRING)
  composite: string

  @ForeignKey(() => ProgrammeModule)
  @Column(DataType.STRING)
  parentId: string

  @Column(DataType.STRING)
  childId: string

  @Column(DataType.JSONB)
  createdAt: object

  @Column(DataType.STRING)
  updatedAt: string
}
