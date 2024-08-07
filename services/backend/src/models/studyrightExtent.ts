/* eslint-disable import/no-cycle */
import { InferAttributes } from 'sequelize'
import { Column, CreatedAt, DataType, HasMany, Model, PrimaryKey, Table, UpdatedAt } from 'sequelize-typescript'

import { ExtentCode } from '../types'
import { Studyright } from './studyright'

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

  @HasMany(() => Studyright, { foreignKey: 'extentcode', sourceKey: 'extentcode' })
  studyrights!: Studyright[]

  @CreatedAt
  @Column(DataType.DATE)
  createdAt!: Date

  @UpdatedAt
  @Column(DataType.DATE)
  updatedAt!: Date
}
