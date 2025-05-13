import { CreationOptional } from 'sequelize'
import { Column, DataType, Model, PrimaryKey, Table } from 'sequelize-typescript'

import type { ProgressCriteria, ProgressCriteriaCreation } from '@oodikone/shared/models/kone'

@Table({
  underscored: true,
  timestamps: true,
  modelName: 'progress_criteria',
  tableName: 'progress_criteria',
})
export class ProgressCriteriaModel
  extends Model<ProgressCriteria, ProgressCriteriaCreation>
  implements ProgressCriteria
{
  @PrimaryKey
  @Column(DataType.STRING)
  code!: string

  @Column(DataType.STRING)
  curriculumVersion!: CreationOptional<string>

  @Column(DataType.ARRAY(DataType.STRING))
  coursesYearOne!: string[]

  @Column(DataType.ARRAY(DataType.STRING))
  coursesYearTwo!: string[]

  @Column(DataType.ARRAY(DataType.STRING))
  coursesYearThree!: string[]

  @Column(DataType.ARRAY(DataType.STRING))
  coursesYearFour!: string[]

  @Column(DataType.ARRAY(DataType.STRING))
  coursesYearFive!: string[]

  @Column(DataType.ARRAY(DataType.STRING))
  coursesYearSix!: string[]

  @Column(DataType.INTEGER)
  creditsYearOne!: number

  @Column(DataType.INTEGER)
  creditsYearTwo!: number

  @Column(DataType.INTEGER)
  creditsYearThree!: number

  @Column(DataType.INTEGER)
  creditsYearFour!: number

  @Column(DataType.INTEGER)
  creditsYearFive!: number

  @Column(DataType.INTEGER)
  creditsYearSix!: number
}
