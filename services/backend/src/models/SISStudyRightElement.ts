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

import type { SISStudyRight, SISStudyRightElement } from '@oodikone/shared/models'
import type { Name, StudyTrack } from '@oodikone/shared/types'
import { DegreeProgrammeType, Phase } from '@oodikone/shared/types'

import { SISStudyRightModel } from './SISStudyRight'

@Table({
  underscored: true,
  tableName: 'sis_study_right_elements',
})
export class SISStudyRightElementModel extends Model<SISStudyRightElement> implements SISStudyRightElement {
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

  @ForeignKey(() => SISStudyRightModel)
  @Column(DataType.STRING)
  studyRightId!: string

  @BelongsTo(() => SISStudyRightModel, { foreignKey: 'studyRightId' })
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
