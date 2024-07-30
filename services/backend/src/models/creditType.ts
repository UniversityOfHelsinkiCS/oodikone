/* eslint-disable import/no-cycle */
import { InferAttributes } from 'sequelize'
import { Column, CreatedAt, DataType, Model, PrimaryKey, Table, UpdatedAt } from 'sequelize-typescript'

import { CreditTypeCode, Name } from '../types'

@Table({
  underscored: true,
  modelName: 'credit_type',
  tableName: 'credit_types',
})
export class CreditType extends Model<InferAttributes<CreditType>> {
  @PrimaryKey
  @Column(DataType.INTEGER)
  credittypecode!: CreditTypeCode

  @Column(DataType.JSONB)
  name!: Required<Name>

  @CreatedAt
  @Column(DataType.DATE)
  createdAt!: Date

  @UpdatedAt
  @Column(DataType.DATE)
  updatedAt!: Date
}
