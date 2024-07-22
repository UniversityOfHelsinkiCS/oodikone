/* eslint-disable import/no-cycle */
import { InferAttributes } from 'sequelize'
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

import { CreditTypeCode } from '../types'
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
export class Credit extends Model<InferAttributes<Credit>> {
  @PrimaryKey
  @Column(DataType.STRING)
  id!: string

  @Column(DataType.STRING)
  grade!: string

  @ForeignKey(() => Student)
  @Column(DataType.STRING)
  student_studentnumber!: string

  @BelongsTo(() => Student, { foreignKey: 'student_studentnumber', targetKey: 'studentnumber' })
  student!: Student

  @BelongsTo(() => Semester, { foreignKey: 'semester_composite' })
  semester!: Semester

  @Column(DataType.DOUBLE)
  credits!: number

  @ForeignKey(() => CreditType)
  @Column(DataType.INTEGER)
  credittypecode!: CreditTypeCode

  @BelongsTo(() => CreditType, { foreignKey: 'credittypecode', targetKey: 'credittypecode' })
  creditType!: CreditType

  @Column(DataType.DATE)
  createdate!: Date

  @Column(DataType.DATE)
  attainment_date!: Date

  @BelongsToMany(() => Teacher, () => CreditTeacher, 'credit_id')
  teachers!: Teacher[]

  @Column(DataType.STRING)
  course_code!: string

  @BelongsTo(() => Course, { foreignKey: 'course_id' })
  course!: Course

  @ForeignKey(() => Course)
  @Column(DataType.STRING)
  course_id!: string

  @Column(DataType.STRING)
  semester_composite!: string

  @Column(DataType.INTEGER)
  semestercode!: number

  @Column(DataType.BOOLEAN)
  isStudyModule!: boolean

  @Column(DataType.STRING)
  org!: string

  @Column(DataType.STRING)
  language!: string

  @Column(DataType.BOOLEAN)
  is_open!: boolean

  @ForeignKey(() => Studyright)
  @Column(DataType.STRING)
  studyright_id!: string

  @BelongsTo(() => Studyright)
  studyright!: Studyright

  @CreatedAt
  @Column(DataType.DATE)
  createdAt!: Date

  @UpdatedAt
  @Column(DataType.DATE)
  updatedAt!: Date

  static passed: ({ credittypecode }: { credittypecode: CreditTypeCode }) => boolean

  static failed: ({ credittypecode }: { credittypecode: CreditTypeCode }) => boolean

  static improved: ({ credittypecode }: { credittypecode: CreditTypeCode }) => boolean

  static notUnnecessary: ({ credits }: { credits: number }) => boolean
}
