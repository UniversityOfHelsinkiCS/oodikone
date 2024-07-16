/* eslint-disable import/no-cycle */
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

import { Course } from './course'
import { Semester } from './semester'
import { Student } from './student'
import { Studyright } from './studyright'

@Table({
  underscored: false,
  modelName: 'enrollment',
  tableName: 'enrollment',
})
export class Enrollment extends Model {
  @PrimaryKey
  @Column(DataType.STRING)
  id: string

  @ForeignKey(() => Student)
  @Column(DataType.STRING)
  studentnumber: string

  @BelongsTo(() => Student)
  student: Student

  @Column(DataType.STRING)
  course_code: string

  @Column(DataType.STRING)
  state: string

  @Column(DataType.DATE)
  enrollment_date_time: Date

  @ForeignKey(() => Course)
  @Column(DataType.STRING)
  course_id: string

  @BelongsTo(() => Course)
  course: Course

  @ForeignKey(() => Semester)
  @Column(DataType.STRING)
  semester_composite: string

  @BelongsTo(() => Semester)
  semester: Semester

  @Column(DataType.INTEGER)
  semestercode: number

  @Column(DataType.BOOLEAN)
  is_open: boolean

  @ForeignKey(() => Studyright)
  @Column(DataType.STRING)
  studyright_id: string

  @BelongsTo(() => Studyright)
  studyright: Studyright

  @CreatedAt
  @Column(DataType.DATE)
  createdAt: Date

  @UpdatedAt
  @Column(DataType.DATE)
  updatedAt: Date
}
