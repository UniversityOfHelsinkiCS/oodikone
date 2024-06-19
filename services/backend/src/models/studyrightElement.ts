import { Model, Table, Column, PrimaryKey, DataType, ForeignKey, BelongsTo, HasMany } from 'sequelize-typescript'
import { Student } from './student'
import { Studyright } from './studyright'
import { ElementDetail } from './elementDetail'

@Table({
  underscored: false,
  modelName: 'studyright_element',
  tableName: 'studyright_elements',
})
export class StudyrightElement extends Model {
  @PrimaryKey
  @Column(DataType.STRING)
  id: string

  @BelongsTo(() => ElementDetail)
  element_detail: ElementDetail

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

  @ForeignKey(() => Student)
  @Column(DataType.STRING)
  studentnumber: string

  @Column(DataType.DATE)
  createdAt: Date

  @Column(DataType.DATE)
  updatedAt: Date
}
