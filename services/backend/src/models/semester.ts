/* eslint-disable import/no-cycle */
import { InferAttributes } from 'sequelize'
import { Column, CreatedAt, DataType, HasMany, Model, PrimaryKey, Table, UpdatedAt } from 'sequelize-typescript'

import { Name } from '../types'
import { SemesterEnrollment } from './semesterEnrollment'

@Table({
  underscored: true,
  modelName: 'semester',
  tableName: 'semesters',
})
export class Semester extends Model<InferAttributes<Semester>> {
  @PrimaryKey
  @Column(DataType.STRING)
  composite!: string

  @HasMany(() => SemesterEnrollment)
  semesterEnrollments!: SemesterEnrollment[]

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
