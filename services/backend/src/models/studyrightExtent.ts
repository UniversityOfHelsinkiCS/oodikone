import { InferAttributes } from 'sequelize'
import { Column, CreatedAt, DataType, Model, PrimaryKey, Table, UpdatedAt } from 'sequelize-typescript'

import { ExtentCode } from '../types'

@Table({
  underscored: true,
  modelName: 'studyright_extent',
  tableName: 'studyright_extents',
})
export class StudyrightExtent extends Model<InferAttributes<StudyrightExtent>> {
  @PrimaryKey
  @Column(DataType.INTEGER)
  extentcode!: ExtentCode

  @Column(DataType.STRING)
  name!: string

  @CreatedAt
  @Column(DataType.DATE)
  createdAt!: Date

  @UpdatedAt
  @Column(DataType.DATE)
  updatedAt!: Date
}
