import { Column, CreatedAt, DataType, Model, PrimaryKey, Table, UpdatedAt } from 'sequelize-typescript'

import type { CreditType } from '@oodikone/shared/models'
import { CreditTypeCode, Name } from '@oodikone/shared/types'

@Table({
  underscored: true,
  modelName: 'credit_type',
  tableName: 'credit_types',
})
export class CreditTypeModel extends Model<CreditType> implements CreditType {
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
