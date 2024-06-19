import { Model, Table, Column, PrimaryKey, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript'
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
