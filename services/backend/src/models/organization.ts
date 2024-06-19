import { Column, DataType, Model, PrimaryKey, Table } from "sequelize-typescript"

@Table({
  underscored: true,
  modelName: 'organization',
  tableName: 'organization',
})
export class Organization extends Model {
  @PrimaryKey
  @Column(DataType.STRING)
  id: string

  @Column(DataType.STRING)
  code: string

  @Column(DataType.STRING)
  name: object

  @Column(DataType.STRING)
  parent_id: string

  @Column(DataType.DATE)
  createdAt: Date

  @Column(DataType.DATE)
  updatedAt: Date
  
}
