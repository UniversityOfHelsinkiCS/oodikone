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

import { ElementDetail } from './elementDetail'
import { Student } from './student'
import { Studyright } from './studyright'

@Table({
  underscored: true,
  modelName: 'transfer',
  tableName: 'transfers',
})
export class Transfer extends Model<InferAttributes<Transfer>> {
  @PrimaryKey
  @Column(DataType.STRING)
  id!: string

  @BelongsTo(() => Student, { foreignKey: 'studentnumber', targetKey: 'studentnumber' })
  student!: Student

  @BelongsTo(() => Studyright, { foreignKey: 'studyrightid', targetKey: 'studyrightid' })
  studyright!: Studyright

  @BelongsTo(() => ElementDetail, { foreignKey: 'sourcecode' })
  source!: ElementDetail

  @BelongsTo(() => ElementDetail, { foreignKey: 'targetcode' })
  target!: ElementDetail

  @ForeignKey(() => ElementDetail)
  @Column(DataType.STRING)
  sourcecode!: string

  @ForeignKey(() => ElementDetail)
  @Column(DataType.STRING)
  targetcode!: string

  @Column(DataType.DATE)
  transferdate!: Date

  @ForeignKey(() => Student)
  @Column(DataType.STRING)
  studentnumber!: string

  @ForeignKey(() => Studyright)
  @Column(DataType.STRING)
  studyrightid!: string

  @CreatedAt
  @Column(DataType.DATE)
  createdAt!: Date

  @UpdatedAt
  @Column(DataType.DATE)
  updatedAt!: Date
}
