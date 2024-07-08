import {
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript'

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
  @Column(DataType.STRING)
  semestercomposite: string

  @BelongsTo(() => Semester)
  semester: Semester

  @Column(DataType.DATE)
  enrollment_date: Date

  @Column(DataType.BOOLEAN)
  statutory_absence: boolean

  @CreatedAt
  @Column(DataType.DATE)
  createdAt: Date

  @UpdatedAt
  @Column(DataType.DATE)
  updatedAt: Date
}
