import { InferAttributes } from 'sequelize'
import { Column, CreatedAt, DataType, ForeignKey, Model, PrimaryKey, Table, UpdatedAt } from 'sequelize-typescript'

import { ProgrammeModule } from './programmeModule'

@Table({
  underscored: true,
  modelName: 'programme_module_child',
  tableName: 'programme_module_children',
})
export class ProgrammeModuleChild extends Model<InferAttributes<ProgrammeModuleChild>> {
  @PrimaryKey
  @Column(DataType.STRING)
  composite!: string

  @ForeignKey(() => ProgrammeModule)
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
