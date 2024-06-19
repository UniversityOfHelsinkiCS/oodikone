import { Model, Table, Column, PrimaryKey, DataType, ForeignKey } from 'sequelize-typescript'
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
  id!: string

  @ForeignKey(() => Student)
  @Column(DataType.STRING)
  studentnumber: string

  @ForeignKey(() => Studyright)
  @Column(DataType.STRING)
  studyrightid: string

  @Column(DataType.STRING)
  programme_code: string

  @Column(DataType.ARRAY(DataType.STRING))
  included_courses: string[]

  @Column(DataType.STRING)
  sisu_id: string

  @Column(DataType.INTEGER)
  completed_credits: number

  @Column(DataType.STRING)
  curriculum_period_id: string

  @Column(DataType.DATE)
  createdAt: Date

  @Column(DataType.DATE)
  updatedAt: Date
}
