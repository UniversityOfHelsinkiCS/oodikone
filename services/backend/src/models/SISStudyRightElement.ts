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

import type { SISStudyRightElement } from '@oodikone/shared/models'
import { SISStudyRightModel } from './SISStudyRight'

@Table({
  underscored: true,
  tableName: 'sis_study_right_elements',
})
export class SISStudyRightElementModel extends Model implements SISStudyRightElement {
  @PrimaryKey
  @Column(DataType.STRING)
  declare id: SISStudyRightElement['id']

  @Column(DataType.DATE)
  declare startDate: SISStudyRightElement['startDate']

  @Column(DataType.DATE)
  declare endDate: SISStudyRightElement['endDate']

  @Column(DataType.BOOLEAN)
  declare graduated: SISStudyRightElement['graduated']

  @Column(DataType.INTEGER)
  declare phase: SISStudyRightElement['phase']

  @ForeignKey(() => SISStudyRightModel)
  @Column(DataType.STRING)
  declare studyRightId: SISStudyRightElement['studyRightId']

  @BelongsTo(() => SISStudyRightModel, { foreignKey: 'studyRightId' })
  declare studyRight: SISStudyRightElement['studyRight']

  @Column(DataType.STRING)
  declare code: SISStudyRightElement['code']

  @Column(DataType.JSONB)
  declare name: SISStudyRightElement['name']

  @Column(DataType.JSONB)
  declare studyTrack: SISStudyRightElement['studyTrack']

  @Column(DataType.STRING)
  declare degreeProgrammeType: SISStudyRightElement['degreeProgrammeType']

  @CreatedAt
  @Column(DataType.DATE)
  declare createdAt: SISStudyRightElement['createdAt']

  @UpdatedAt
  @Column(DataType.DATE)
  declare updatedAt: SISStudyRightElement['updatedAt']
}
