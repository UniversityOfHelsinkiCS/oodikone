import {
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript'

import { SemesterEnrollment } from './semesterEnrollment'

@Table({
  underscored: true,
  modelName: 'semester',
  tableName: 'semesters',
})
export class Semester extends Model {
  @PrimaryKey
  @Column(DataType.STRING)
  composite: string

  @ForeignKey(() => SemesterEnrollment)
  @Column(DataType.STRING)
  semestercomposite: string

  @HasMany(() => SemesterEnrollment, { foreignKey: 'semestercomposite', sourceKey: 'composite' })
  semesterEnrollments: SemesterEnrollment[]

  @Column(DataType.INTEGER)
  semestercode: number

  @Column(DataType.JSONB)
  name: object

  @Column(DataType.INTEGER)
  startYear: number

  @Column(DataType.DATE)
  startdate: Date

  @Column(DataType.DATE)
  enddate: Date

  @Column(DataType.INTEGER)
  yearcode: number

  @Column(DataType.STRING)
  yearname: string

  @Column(DataType.STRING)
  org: string

  @Column(DataType.INTEGER)
  termIndex: number

  @CreatedAt
  @Column(DataType.DATE)
  createdAt: Date

  @UpdatedAt
  @Column(DataType.DATE)
  updatedAt: Date
}
