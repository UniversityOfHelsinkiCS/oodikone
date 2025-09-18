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

import type { Credit } from '@oodikone/shared/models'
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
export class CreditModel extends Model implements Credit {
  @PrimaryKey
  @Column(DataType.STRING)
  declare id: Credit['id']

  @Column(DataType.STRING)
  declare grade: Credit['grade']

  @ForeignKey(() => StudentModel)
  @Column(DataType.STRING)
  declare student_studentnumber: Credit['student_studentnumber']

  @BelongsTo(() => StudentModel, { foreignKey: 'student_studentnumber', targetKey: 'studentnumber' })
  declare student: Credit['student']

  @BelongsTo(() => SemesterModel, { foreignKey: 'semester_composite' })
  declare semester: Credit['semester']

  @Column(DataType.DOUBLE)
  declare credits: Credit['credits']

  @ForeignKey(() => CreditTypeModel)
  @Column(DataType.INTEGER)
  declare credittypecode: Credit['credittypecode']

  @BelongsTo(() => CreditTypeModel, { foreignKey: 'credittypecode', targetKey: 'credittypecode' })
  declare creditType: Credit['creditType']

  @Column(DataType.DATE)
  declare createdate: Credit['createdate']

  @Column(DataType.DATE)
  declare attainment_date: Credit['attainment_date']

  @BelongsToMany(() => TeacherModel, () => CreditTeacherModel, 'credit_id')
  declare teachers: Credit['teachers']

  @Column(DataType.STRING)
  declare course_code: Credit['course_code']

  @BelongsTo(() => CourseModel, { foreignKey: 'course_id' })
  declare course: Credit['course']

  @ForeignKey(() => CourseModel)
  @Column(DataType.STRING)
  declare course_id: Credit['course_id']

  @Column(DataType.STRING)
  declare semester_composite: Credit['semester_composite']

  @Column(DataType.INTEGER)
  declare semestercode: Credit['semestercode']

  @Column(DataType.BOOLEAN)
  declare isStudyModule: Credit['isStudyModule']

  @Column(DataType.STRING)
  declare org: Credit['org']

  @Column(DataType.STRING)
  declare language: Credit['language']

  @Column(DataType.BOOLEAN)
  declare is_open: Credit['is_open']

  @ForeignKey(() => SISStudyRightModel)
  @Column(DataType.STRING)
  declare studyright_id: Credit['studyright_id']

  @BelongsTo(() => SISStudyRightModel)
  declare studyright: Credit['studyright']

  @CreatedAt
  @Column(DataType.DATE)
  declare createdAt: Credit['createdAt']

  @UpdatedAt
  @Column(DataType.DATE)
  declare updatedAt: Credit['updatedAt']

  static passed: ({ credittypecode }: { credittypecode: CreditTypeCode }) => boolean

  static failed: ({ credittypecode }: { credittypecode: CreditTypeCode }) => boolean

  static improved: ({ credittypecode }: { credittypecode: CreditTypeCode }) => boolean

  static notUnnecessary: ({ credits }: { credits: number }) => boolean
}

CreditModel.passed = ({ credittypecode }) => [CreditTypeCode.PASSED, CreditTypeCode.APPROVED].includes(credittypecode)
CreditModel.failed = ({ credittypecode }) => credittypecode === CreditTypeCode.FAILED
CreditModel.improved = ({ credittypecode }) => credittypecode === CreditTypeCode.IMPROVED
CreditModel.notUnnecessary = ({ credits }) => credits > 0 && credits <= 12
