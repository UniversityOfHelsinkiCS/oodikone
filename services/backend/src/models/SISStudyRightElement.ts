/* eslint-disable import/no-cycle */
import { BelongsTo, Column, CreatedAt, DataType, Model, PrimaryKey, Table, UpdatedAt } from 'sequelize-typescript'

import { Name, Phase, StudyTrack } from '../types'
import { SISStudyRight } from './SISStudyRight'

@Table({
  underscored: true,
  tableName: 'sis_study_right_elements',
})
export class SISStudyRightElement extends Model {
  @PrimaryKey
  @Column(DataType.STRING)
  id: string

  @Column(DataType.DATE)
  startDate: Date

  @Column(DataType.DATE)
  endDate: Date

  @Column(DataType.BOOLEAN)
  graduated: boolean

  @Column(DataType.INTEGER)
  phase: Phase

  @Column(DataType.STRING)
  studyRightId: string

  @BelongsTo(() => SISStudyRight, { foreignKey: 'studyRightId' })
  studyRight: SISStudyRight

  @Column(DataType.STRING)
  code: string

  @Column(DataType.JSONB)
  name: Name

  @Column(DataType.JSONB)
  studyTrack: StudyTrack

  @Column(DataType.STRING)
  degreeProgrammeType: string

  @CreatedAt
  @Column(DataType.DATE)
  createdAt: Date

  @UpdatedAt
  @Column(DataType.DATE)
  updatedAt: Date
}
