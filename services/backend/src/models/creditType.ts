import { Table, Column, DataType, PrimaryKey, CreatedAt, UpdatedAt, Model } from 'sequelize-typescript'

@Table({
  underscored: true,
  modelName: 'credit_type',
  tableName: 'credit_types',
})
export class CreditType extends Model {
  @PrimaryKey
  @Column(DataType.INTEGER)
  credittypecode!: number

  @Column(DataType.JSONB)
  name!: object

  @CreatedAt
  @Column(DataType.DATE)
  createdAt!: Date

  @UpdatedAt
  @Column(DataType.DATE)
  updatedAt!: Date
}
