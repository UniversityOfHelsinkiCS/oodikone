import { Model, Table, Column, PrimaryKey, DataType, HasMany } from 'sequelize-typescript'
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

  @HasMany(() => SemesterEnrollment, { foreignKey: 'semestercomposite', sourceKey: 'composite' })
  semesterEnrollments: SemesterEnrollment[]

  @Column(DataType.INTEGER)
  semestercode: number

  @Column(DataType.JSONB)
  name: object

  @Column(DataType.DATE)
  startdate: Date

  @Column(DataType.DATE)
  enddate: Date

  @Column(DataType.INTEGER)
  yearcode: number

  @Column(DataType.STRING)
  org: string

  @Column(DataType.STRING)
  yearname: string

  @Column(DataType.INTEGER)
  termIndex: number

  @Column(DataType.INTEGER)
  startYear: number

  @Column(DataType.DATE)
  createdAt: Date

  @Column(DataType.DATE)
  updatedAt: Date
}
