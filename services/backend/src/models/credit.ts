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

import type { Credit, Course, CreditType, Semester, SISStudyRight, Student, Teacher } from '@oodikone/shared/models'
import { CreditTypeCode } from '@oodikone/shared/types'

import { CourseModel } from './course'
import { CreditTeacherModel } from './creditTeacher'
import { CreditTypeModel } from './creditType'
import { SemesterModel } from './semester'
import { SISStudyRightModel } from './SISStudyRight'
import { StudentModel } from './student'
import { TeacherModel } from './teacher'

@Table({
  underscored: false,
  modelName: 'credit',
  tableName: 'credit',
})
export class CreditModel extends Model<Credit> implements Credit {
  @PrimaryKey
  @Column(DataType.STRING)
  id!: string

  @Column(DataType.STRING)
  grade!: string

  @ForeignKey(() => StudentModel)
  @Column(DataType.STRING)
  student_studentnumber!: string

  @BelongsTo(() => StudentModel, { foreignKey: 'student_studentnumber', targetKey: 'studentnumber' })
  student!: Student

  @BelongsTo(() => SemesterModel, { foreignKey: 'semester_composite' })
  semester!: Semester

  @Column(DataType.DOUBLE)
  credits!: number

  @ForeignKey(() => CreditTypeModel)
  @Column(DataType.INTEGER)
  credittypecode!: CreditTypeCode

  @BelongsTo(() => CreditTypeModel, { foreignKey: 'credittypecode', targetKey: 'credittypecode' })
  creditType!: CreditType

  @Column(DataType.DATE)
  createdate!: Date

  @Column(DataType.DATE)
  attainment_date!: Date

  @BelongsToMany(() => TeacherModel, () => CreditTeacherModel, 'credit_id')
  teachers!: Teacher[]

  @Column(DataType.STRING)
  course_code!: string

  @BelongsTo(() => CourseModel, { foreignKey: 'course_id' })
  course!: Course

  @ForeignKey(() => CourseModel)
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

  @ForeignKey(() => SISStudyRightModel)
  @Column(DataType.STRING)
  studyright_id!: string

  @BelongsTo(() => SISStudyRightModel)
  studyright!: SISStudyRight

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

CreditModel.passed = ({ credittypecode }) => [CreditTypeCode.PASSED, CreditTypeCode.APPROVED].includes(credittypecode)
CreditModel.failed = ({ credittypecode }) => credittypecode === CreditTypeCode.FAILED
CreditModel.improved = ({ credittypecode }) => credittypecode === CreditTypeCode.IMPROVED
CreditModel.notUnnecessary = ({ credits }) => credits > 0 && credits <= 12
