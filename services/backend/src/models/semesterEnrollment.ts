import { Model, Table, Column, PrimaryKey, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript'
import { Semester } from './semester'
import { Student } from './student'

@Table({
  underscored: false,
  modelName: 'semester_enrollment',
  tableName: 'semester_enrollments',
})
export class SemesterEnrollment extends Model {
  @PrimaryKey
  @Column(DataType.INTEGER)
  enrollmenttype: number

  @Column(DataType.STRING)
  org: string

  @ForeignKey(() => Student)
  @Column(DataType.STRING)
  studentnumber: string

  @BelongsTo(() => Student)
  student: Student

  @Column(DataType.INTEGER)
  semestercode: number

  @ForeignKey(() => Semester)
  @Column(DataType.DATE)
  semestercomposite: string

  @Column(DataType.DATE)
  enrollment_date: Date

  @Column(DataType.BOOLEAN)
  statutory_absence: boolean

  @Column(DataType.DATE)
  createdAt: Date

  @Column(DataType.DATE)
  updatedAt: Date

}