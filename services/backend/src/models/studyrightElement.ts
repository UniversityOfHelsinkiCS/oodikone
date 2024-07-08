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

  @BelongsTo(() => ElementDetail, { foreignKey: 'code', targetKey: 'code' })
  element_detail: ElementDetail

  @Column(DataType.STRING)
  startdate: string

  @Column(DataType.DATE)
  enddate: Date

  @ForeignKey(() => Studyright)
  @Column(DataType.STRING)
  studyrightid: string

  @BelongsTo(() => Studyright, { foreignKey: 'studyrightid', targetKey: 'studyrightid' })
  studyright: Studyright

  @BelongsTo(() => Student, { foreignKey: 'studentnumber', targetKey: 'studentnumber' })
  student: Student

  @ForeignKey(() => ElementDetail)
  @Column(DataType.STRING)
  code: string

  @ForeignKey(() => Student)
  @Column(DataType.STRING)
  studentnumber: string

  @CreatedAt
  @Column(DataType.DATE)
  createdAt: Date

  @UpdatedAt
  @Column(DataType.DATE)
  updatedAt: Date
}
