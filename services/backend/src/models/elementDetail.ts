import { Model, Table, Column, PrimaryKey, DataType } from 'sequelize-typescript'

@Table({
  underscored: true,
  modelName: 'element_detail',
  tableName: 'element_details',
})
export class ElementDetail extends Model {
  @PrimaryKey
  @Column(DataType.INTEGER)
  code: number

  @Column(DataType.JSONB)
  name: object

  @Column(DataType.INTEGER)
  type: number

  @Column(DataType.DATE)
  updatedAt: Date

  @Column(DataType.DATE)
  createdAt: Date
}
