/* eslint-disable import/no-cycle */
import {
  BelongsTo,
  BelongsToMany,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript'

import { CreditTypeCode } from '../types/creditTypeCode'
import { Course } from './course'
import { CreditTeacher } from './creditTeacher'
import { CreditType } from './creditType'
import { Semester } from './semester'
import { Student } from './student'
import { Studyright } from './studyright'
import { Teacher } from './teacher'

@Table({
  underscored: false,
  modelName: 'credit',
  tableName: 'credit',
})
export class Credit extends Model {
  @PrimaryKey
  @Column(DataType.STRING)
  id: string

  @Column(DataType.STRING)
  grade: string

  @ForeignKey(() => Student)
  @Column(DataType.STRING)
  student_studentnumber: string

  @BelongsTo(() => Student)
  student: Student

  @Column(DataType.DOUBLE)
  credits: number

  @ForeignKey(() => CreditType)
  @Column(DataType.INTEGER)
  credittypecode: CreditTypeCode

  @BelongsTo(() => CreditType)
  creditType: CreditType

  @Column(DataType.DATE)
  createdate: Date

  @Column(DataType.DATE)
  attainment_date: Date

  @BelongsToMany(() => Teacher, () => CreditTeacher, 'credit_id')
  teachers: Teacher[]

  @Column(DataType.STRING)
  course_code: string

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
  isStudyModule: boolean

  @Column(DataType.STRING)
  org: string

  @Column(DataType.STRING)
  language: string

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

  static passed: ({ credittypecode }: { credittypecode: CreditTypeCode }) => boolean

  static failed: ({ credittypecode }: { credittypecode: CreditTypeCode }) => boolean

  static improved: ({ credittypecode }: { credittypecode: CreditTypeCode }) => boolean

  static notUnnecessary: ({ credits }: { credits: number }) => boolean
}
