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
  underscored: true,
  modelName: 'transfer',
  tableName: 'transfers',
})
export class Transfer extends Model {
  @PrimaryKey
  @Column(DataType.STRING)
  id: string

  @ForeignKey(() => ElementDetail)
  @Column(DataType.STRING)
  sourcecode: string

  @BelongsTo(() => ElementDetail)
  source: ElementDetail

  @ForeignKey(() => ElementDetail)
  @Column(DataType.STRING)
  targetcode: string

  @BelongsTo(() => ElementDetail)
  target: ElementDetail

  @Column(DataType.DATE)
  transferdate: Date

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

  @CreatedAt
  @Column(DataType.DATE)
  createdAt: Date

  @UpdatedAt
  @Column(DataType.DATE)
  updatedAt: Date
}
