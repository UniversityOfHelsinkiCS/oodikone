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

import type { Enrollment, Semester, SISStudyRight, Student } from '@oodikone/shared/models'
import { EnrollmentState } from '@oodikone/shared/types'

import { CourseModel } from './course'
import { SemesterModel } from './semester'
import { SISStudyRightModel } from './SISStudyRight'
import { StudentModel } from './student'

@Table({
  underscored: false,
  modelName: 'enrollment',
  tableName: 'enrollment',
})
export class EnrollmentModel extends Model<Enrollment> implements Enrollment {
  @PrimaryKey
  @Column(DataType.STRING)
  id!: string

  @ForeignKey(() => StudentModel)
  @Column(DataType.STRING)
  studentnumber!: string

  @BelongsTo(() => StudentModel, { foreignKey: 'studentnumber', targetKey: 'studentnumber' })
  student!: Student

  @Column(DataType.STRING)
  course_code!: string

  @Column(DataType.STRING)
  state!: EnrollmentState

  @Column(DataType.DATE)
  enrollment_date_time!: Date

  @ForeignKey(() => CourseModel)
  @Column(DataType.STRING)
  course_id!: string

  @ForeignKey(() => SemesterModel)
  @Column(DataType.STRING)
  semester_composite!: string

  @BelongsTo(() => SemesterModel, { foreignKey: 'semester_composite', targetKey: 'composite' })
  semester!: Semester

  @Column(DataType.INTEGER)
  semestercode!: number

  @Column(DataType.BOOLEAN)
  is_open!: boolean

  @ForeignKey(() => SISStudyRightModel)
  @Column({ type: DataType.STRING, allowNull: true })
  studyright_id!: string

  @BelongsTo(() => SISStudyRightModel, { foreignKey: 'studyright_id', targetKey: 'id', constraints: false })
  studyright!: SISStudyRight

  @BelongsTo(() => CourseModel, { foreignKey: 'course_id', targetKey: 'id' })
  course!: CourseModel

  @CreatedAt
  @Column(DataType.DATE)
  createdAt!: Date

  @UpdatedAt
  @Column(DataType.DATE)
  updatedAt!: Date
}
