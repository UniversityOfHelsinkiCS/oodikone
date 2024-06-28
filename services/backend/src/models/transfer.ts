import { Model, Table, Column, PrimaryKey, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript'
import { ElementDetail } from './elementDetail'
import { Studyright } from './studyright'
import { Student } from './student'

@Table({
  underscored: true,
  modelName: 'transfer',
  tableName: 'transfers',
})
export class Transfer extends Model {
  @PrimaryKey
  @Column(DataType.STRING)
  id: string

  @BelongsTo(() => Student, { foreignKey: 'studentnumber', targetKey: 'studentnumber' })
  student: Student

  @BelongsTo(() => Studyright, { foreignKey: 'studyrightid', targetKey: 'studyrightid' })
  studyright: Studyright

  @BelongsTo(() => ElementDetail, { foreignKey: 'sourcecode' })
  source: ElementDetail

  @BelongsTo(() => ElementDetail, { foreignKey: 'targetcode' })
  target: ElementDetail

  @ForeignKey(() => ElementDetail)
  @Column(DataType.STRING)
  sourcecode: string

  @ForeignKey(() => ElementDetail)
  @Column(DataType.STRING)
  targetcode: string

  @Column(DataType.STRING)
  transferdate: string

  @ForeignKey(() => Student)
  @Column(DataType.STRING)
  studentnumber: string

  @ForeignKey(() => Studyright)
  @Column(DataType.STRING)
  studyrightid: string

  @Column(DataType.DATE)
  createdAt: Date

  @Column(DataType.DATE)
  updatedAt: Date
}
