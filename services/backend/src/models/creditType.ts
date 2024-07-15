import { Column, CreatedAt, DataType, Model, PrimaryKey, Table, UpdatedAt } from 'sequelize-typescript'

import { CreditTypeCode } from '../types/creditTypeCode'

@Table({
  underscored: true,
  modelName: 'credit_type',
  tableName: 'credit_types',
})
export class CreditType extends Model {
  @PrimaryKey
  @Column(DataType.INTEGER)
  credittypecode: CreditTypeCode

  @Column(DataType.JSONB)
  name: object

  @CreatedAt
  @Column(DataType.DATE)
  createdAt: Date

  @UpdatedAt
  @Column(DataType.DATE)
  updatedAt: Date
}
