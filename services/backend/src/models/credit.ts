import { BelongsTo, BelongsToMany, Column, DataType, ForeignKey, Model, PrimaryKey, Table } from 'sequelize-typescript'

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
  id!: string

  // TODO This could be typed more accurately, to hold all possible values that exist in db
  @Column(DataType.STRING)
  grade: string

  @ForeignKey(() => Student)
  @Column(DataType.STRING)
  student_studentnumber: string

  @BelongsTo(() => Semester, { foreignKey: { name: 'semester_composite', allowNull: false } })
  semester: Semester

  @BelongsTo(() => Student, { foreignKey: 'student_studentnumber', targetKey: 'studentnumber' })
  student: Student

  @Column(DataType.DOUBLE)
  credits: number

  @Column(DataType.DATE)
  createdate: Date

  @ForeignKey(() => CreditType)
  @Column(DataType.INTEGER)
  credittypecode: number

  @BelongsTo(() => CreditType, { foreignKey: 'credittypecode', targetKey: 'credittypecode' })
  creditType: CreditType

  @BelongsToMany(() => Teacher, () => CreditTeacher, 'credit_id')
  teachers: Teacher[]

  @Column(DataType.DATE)
  attainment_date: Date

  @Column(DataType.STRING)
  course_code: string

  @BelongsTo(() => Course, { foreignKey: 'course_id' })
  course: Course

  @ForeignKey(() => Course)
  @Column(DataType.STRING)
  course_id: string

  @Column(DataType.STRING)
  semester_composite: string

  @Column(DataType.BOOLEAN)
  isStudyModule: boolean

  @Column(DataType.STRING)
  org: string

  @Column(DataType.DATE)
  createdAt: string

  @Column(DataType.DATE)
  updatedAt: string

  @Column(DataType.STRING)
  language: string

  @ForeignKey(() => Studyright)
  @Column(DataType.STRING)
  studyright_id: string

  @BelongsTo(() => Studyright)
  studyright: Studyright

  static passed: (credit: any) => boolean
  static failed: (credit: any) => boolean
  static improved: (credit: any) => boolean
  static notUnnecessary: (credit: any) => boolean
}
