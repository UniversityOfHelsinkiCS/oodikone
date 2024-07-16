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

import { SISStudyRight } from './SISStudyRight'
import { Student } from './student'
import { Studyright } from './studyright'

@Table({
  underscored: false,
  modelName: 'studyplan',
  tableName: 'studyplan',
})
export class Studyplan extends Model {
  @PrimaryKey
  @Column(DataType.STRING)
  id: string

  @ForeignKey(() => Student)
  @Column(DataType.STRING)
  studentnumber: string

  @BelongsTo(() => Student)
  student: Student

  @ForeignKey(() => Studyright)
  @Column(DataType.STRING)
  studyrightid: string

  @BelongsTo(() => Studyright)
  studyright: Studyright

  @ForeignKey(() => SISStudyRight)
  @Column(DataType.STRING)
  sis_study_right_id: string

  @BelongsTo(() => SISStudyRight)
  studyRight: SISStudyRight

  @Column(DataType.STRING)
  programme_code: string

  @Column(DataType.ARRAY(DataType.STRING))
  included_courses: string[]

  @Column(DataType.STRING)
  sisu_id: string

  @Column(DataType.DOUBLE)
  completed_credits: number

  @Column(DataType.STRING)
  curriculum_period_id: string

  @CreatedAt
  @Column(DataType.DATE)
  createdAt: Date

  @UpdatedAt
  @Column(DataType.DATE)
  updatedAt: Date
}
