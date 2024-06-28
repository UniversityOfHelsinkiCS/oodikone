import { Model, Table, Column, PrimaryKey, DataType, HasMany } from 'sequelize-typescript'
import { Studyright } from './studyright'

@Table({
  underscored: true,
  modelName: 'studyright_extent',
  tableName: 'studyright_extents',
})
export class StudyrightExtent extends Model {
  @PrimaryKey
  @Column(DataType.INTEGER)
  extentcode: number

  @Column(DataType.STRING)
  name: string

  @Column(DataType.DATE)
  createdAt: Date

  @Column(DataType.DATE)
  updatedAt: Date

  @HasMany(() => Studyright, { foreignKey: 'extentcode', sourceKey: 'extentcode' })
  studyrights: Studyright[]
}
