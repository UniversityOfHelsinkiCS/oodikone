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

import { Name } from '@shared/types'
import { DegreeProgrammeType, Phase, StudyTrack } from '../types'
import { SISStudyRight } from './SISStudyRight'

@Table({
  underscored: true,
  tableName: 'sis_study_right_elements',
})
export class SISStudyRightElement extends Model<InferAttributes<SISStudyRightElement>> {
  @PrimaryKey
  @Column(DataType.STRING)
  id!: string

  @Column(DataType.DATE)
  startDate!: Date

  @Column(DataType.DATE)
  endDate!: Date

  @Column(DataType.BOOLEAN)
  graduated!: boolean

  @Column(DataType.INTEGER)
  phase!: Phase

  @ForeignKey(() => SISStudyRight)
  @Column(DataType.STRING)
  studyRightId!: string

  @BelongsTo(() => SISStudyRight, { foreignKey: 'studyRightId' })
  studyRight!: SISStudyRight

  @Column(DataType.STRING)
  code!: string

  @Column(DataType.JSONB)
  name!: Name

  @Column(DataType.JSONB)
  studyTrack!: StudyTrack | null

  @Column(DataType.STRING)
  degreeProgrammeType!: DegreeProgrammeType

  @CreatedAt
  @Column(DataType.DATE)
  createdAt!: Date

  @UpdatedAt
  @Column(DataType.DATE)
  updatedAt!: Date
}
