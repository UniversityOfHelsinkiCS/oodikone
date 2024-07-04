import { Column, DataType, HasMany, Model, PrimaryKey, Table } from 'sequelize-typescript'

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

  @Column(DataType.DATE)
  updatedAt: Date

  @Column(DataType.DATE)
  createdAt: Date

  @HasMany(() => StudyrightElement, { foreignKey: 'code', sourceKey: 'code' })
  studyrightElements: StudyrightElement
}
