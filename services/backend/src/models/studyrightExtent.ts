import { Column, CreatedAt, DataType, Model, PrimaryKey, Table, UpdatedAt } from 'sequelize-typescript'

import type { StudyrightExtent } from '@oodikone/shared/models'
import { ExtentCode } from '@oodikone/shared/types'

@Table({
  underscored: true,
  modelName: 'studyright_extent',
  tableName: 'studyright_extents',
})
export class StudyrightExtentModel extends Model<StudyrightExtent> implements StudyrightExtent {
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
