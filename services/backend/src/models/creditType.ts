import { Column, CreatedAt, DataType, Model, PrimaryKey, Table, UpdatedAt } from 'sequelize-typescript'

import type { CreditType } from '@oodikone/shared/models'

@Table({
  underscored: true,
  modelName: 'credit_type',
  tableName: 'credit_types',
})
export class CreditTypeModel extends Model<CreditType> implements CreditType {
  @PrimaryKey
  @Column(DataType.INTEGER)
  declare credittypecode: CreditType['credittypecode']

  @Column(DataType.JSONB)
  declare name: CreditType['name']

  @CreatedAt
  @Column(DataType.DATE)
  declare createdAt: CreditType['createdAt']

  @UpdatedAt
  @Column(DataType.DATE)
  declare updatedAt: CreditType['updatedAt']
}
