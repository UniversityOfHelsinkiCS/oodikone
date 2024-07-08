import { Column, DataType, Model, PrimaryKey, Table } from 'sequelize-typescript'

@Table({
  underscored: true,
  timestamps: true,
  modelName: 'progress_criteria',
  tableName: 'progress_criteria',
})
export class ProgressCriteria extends Model {
  @PrimaryKey
  @Column(DataType.STRING)
  code: string

  @Column(DataType.STRING)
  curriculumVersion: string

  @Column(DataType.ARRAY(DataType.STRING))
  coursesYearOne: string[]

  @Column(DataType.ARRAY(DataType.STRING))
  coursesYearTwo: string[]

  @Column(DataType.ARRAY(DataType.STRING))
  coursesYearThree: string[]

  @Column(DataType.ARRAY(DataType.STRING))
  coursesYearFour: string[]

  @Column(DataType.ARRAY(DataType.STRING))
  coursesYearFive: string[]

  @Column(DataType.ARRAY(DataType.STRING))
  coursesYearSix: string[]

  @Column(DataType.INTEGER)
  creditsYearOne: number

  @Column(DataType.INTEGER)
  creditsYearTwo: number

  @Column(DataType.INTEGER)
  creditsYearThree: number

  @Column(DataType.INTEGER)
  creditsYearFour: number

  @Column(DataType.INTEGER)
  creditsYearFive: number

  @Column(DataType.INTEGER)
  creditsYearSix: number
}
