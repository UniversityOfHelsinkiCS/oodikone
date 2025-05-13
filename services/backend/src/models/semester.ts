import { Column, CreatedAt, DataType, Model, PrimaryKey, Table, UpdatedAt } from 'sequelize-typescript'

import type { Semester } from '@oodikone/shared/models'
import type { Name } from '@oodikone/shared/types'

@Table({
  underscored: true,
  modelName: 'semester',
  tableName: 'semesters',
})
export class SemesterModel extends Model<Semester> implements Semester {
  @PrimaryKey
  @Column(DataType.STRING)
  composite!: string

  @Column(DataType.INTEGER)
  semestercode!: number

  @Column(DataType.JSONB)
  name!: Name

  @Column(DataType.INTEGER)
  startYear!: number

  @Column(DataType.DATE)
  startdate!: Date

  @Column(DataType.DATE)
  enddate!: Date

  @Column(DataType.INTEGER)
  yearcode!: number

  @Column(DataType.STRING)
  yearname!: string

  @Column(DataType.STRING)
  org!: string

  @Column(DataType.INTEGER)
  termIndex!: number

  @CreatedAt
  @Column(DataType.DATE)
  createdAt!: Date

  @UpdatedAt
  @Column(DataType.DATE)
  updatedAt!: Date
}
