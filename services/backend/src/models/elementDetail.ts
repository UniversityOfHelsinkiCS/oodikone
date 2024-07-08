import { Column, CreatedAt, DataType, HasMany, Model, PrimaryKey, Table, UpdatedAt } from 'sequelize-typescript'

import { StudyrightElement } from './studyrightElement'

@Table({
  underscored: false,
  modelName: 'element_detail',
  tableName: 'element_details',
})
export class ElementDetail extends Model {
  @PrimaryKey
  @Column(DataType.STRING)
  code: string

  @Column(DataType.JSONB)
  name: object

  @Column(DataType.INTEGER)
  type: number

  @HasMany(() => StudyrightElement, { foreignKey: 'code', sourceKey: 'code' })
  studyrightElements: StudyrightElement

  @CreatedAt
  @Column(DataType.DATE)
  createdAt: Date

  @UpdatedAt
  @Column(DataType.DATE)
  updatedAt: Date
}
