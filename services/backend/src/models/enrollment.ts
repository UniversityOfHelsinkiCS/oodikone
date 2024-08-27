/* eslint-disable import/no-cycle */
import { InferAttributes } from 'sequelize'
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

import { EnrollmentState } from '../types'
import { Course, Semester, SISStudyRight, Student } from '.'

@Table({
  underscored: false,
  modelName: 'enrollment',
  tableName: 'enrollment',
})
export class Enrollment extends Model<InferAttributes<Enrollment>> {
  @PrimaryKey
  @Column(DataType.STRING)
  id!: string

  @ForeignKey(() => Student)
  @Column(DataType.STRING)
  studentnumber!: string

  @BelongsTo(() => Student, { foreignKey: 'studentnumber', targetKey: 'studentnumber' })
  student!: Student

  @Column(DataType.STRING)
  course_code!: string

  @Column(DataType.STRING)
  state!: EnrollmentState

  @Column(DataType.DATE)
  enrollment_date_time!: Date

  @ForeignKey(() => Course)
  @Column(DataType.STRING)
  course_id!: string

  @ForeignKey(() => Semester)
  @Column(DataType.STRING)
  semester_composite!: string

  @BelongsTo(() => Semester, { foreignKey: 'semester_composite', targetKey: 'composite' })
  semester!: Semester

  @Column(DataType.INTEGER)
  semestercode!: number

  @Column(DataType.BOOLEAN)
  is_open!: boolean

  @ForeignKey(() => SISStudyRight)
  @Column({ type: DataType.STRING, allowNull: true })
  studyright_id!: string

  @BelongsTo(() => SISStudyRight, { foreignKey: 'studyright_id', targetKey: 'id', constraints: false })
  studyright!: SISStudyRight

  @BelongsTo(() => Course, { foreignKey: 'course_id', targetKey: 'id' })
  course!: Course

  @CreatedAt
  @Column(DataType.DATE)
  createdAt!: Date

  @UpdatedAt
  @Column(DataType.DATE)
  updatedAt!: Date
}
