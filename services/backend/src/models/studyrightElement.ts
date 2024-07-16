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

import { ElementDetail } from './elementDetail'
import { Student } from './student'
import { Studyright } from './studyright'

@Table({
  underscored: false,
  modelName: 'studyright_element',
  tableName: 'studyright_elements',
})
export class StudyrightElement extends Model {
  @PrimaryKey
  @Column(DataType.STRING)
  id: string

  @Column(DataType.STRING)
  startdate: string

  @Column(DataType.DATE)
  enddate: Date

  @ForeignKey(() => Studyright)
  @Column(DataType.STRING)
  studyrightid: string

  @BelongsTo(() => Studyright)
  studyright: Studyright

  @ForeignKey(() => ElementDetail)
  @Column(DataType.STRING)
  code: string

  @BelongsTo(() => ElementDetail)
  element_detail: ElementDetail

  @ForeignKey(() => Student)
  @Column(DataType.STRING)
  studentnumber: string

  @BelongsTo(() => Student)
  student: Student

  @CreatedAt
  @Column(DataType.DATE)
  createdAt: Date

  @UpdatedAt
  @Column(DataType.DATE)
  updatedAt: Date
}
