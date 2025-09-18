import { Column, DataType, Model, PrimaryKey, Table } from 'sequelize-typescript'

import type { ProgressCriteria } from '@oodikone/shared/models/kone'

@Table({
  underscored: true,
  timestamps: true,
  modelName: 'progress_criteria',
  tableName: 'progress_criteria',
})
export class ProgressCriteriaModel extends Model implements ProgressCriteria {
  @PrimaryKey
  @Column(DataType.STRING)
  declare code: ProgressCriteria['code']

  @Column(DataType.STRING)
  declare curriculumVersion: ProgressCriteria['curriculumVersion']

  @Column(DataType.ARRAY(DataType.STRING))
  declare coursesYearOne: ProgressCriteria['coursesYearOne']

  @Column(DataType.ARRAY(DataType.STRING))
  declare coursesYearTwo: ProgressCriteria['coursesYearTwo']

  @Column(DataType.ARRAY(DataType.STRING))
  declare coursesYearThree: ProgressCriteria['coursesYearThree']

  @Column(DataType.ARRAY(DataType.STRING))
  declare coursesYearFour: ProgressCriteria['coursesYearFour']

  @Column(DataType.ARRAY(DataType.STRING))
  declare coursesYearFive: ProgressCriteria['coursesYearFive']

  @Column(DataType.ARRAY(DataType.STRING))
  declare coursesYearSix: ProgressCriteria['coursesYearSix']

  @Column(DataType.INTEGER)
  declare creditsYearOne: ProgressCriteria['creditsYearOne']

  @Column(DataType.INTEGER)
  declare creditsYearTwo: ProgressCriteria['creditsYearTwo']

  @Column(DataType.INTEGER)
  declare creditsYearThree: ProgressCriteria['creditsYearThree']

  @Column(DataType.INTEGER)
  declare creditsYearFour: ProgressCriteria['creditsYearFour']

  @Column(DataType.INTEGER)
  declare creditsYearFive: ProgressCriteria['creditsYearFive']

  @Column(DataType.INTEGER)
  declare creditsYearSix: ProgressCriteria['creditsYearSix']
}
