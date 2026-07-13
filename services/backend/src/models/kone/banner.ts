import { Column, DataType, Model, PrimaryKey, Table, AutoIncrement } from 'sequelize-typescript'

import type { Banner } from '@oodikone/shared/models/kone'

@Table({
  underscored: true,
  modelName: 'banner',
  tableName: 'banners',
})
export class BannerModel extends Model implements Banner {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number

  @Column(DataType.DATE)
  declare startDate: Date

  @Column(DataType.DATE)
  declare endDate: Date

  @Column(DataType.STRING)
  declare text: string

  @Column(DataType.STRING)
  declare color: string

  @Column(DataType.STRING)
  declare lightness: 'light' | 'main' | 'dark'

  @Column(DataType.STRING)
  declare lastModifiedBy: string
}
