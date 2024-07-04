import { BelongsTo, Column, DataType, Model, PrimaryKey, Table } from 'sequelize-typescript'
import { Organization } from './organization'
import { SISStudyRight } from './SISStudyRight'

@Table({
  underscored: true,
  tableName: 'sis_study_right_elements',
})
export class SISStudyRightElement extends Model {
  @PrimaryKey
  @Column(DataType.STRING)
  id!: string

  @BelongsTo(() => SISStudyRight, { foreignKey: 'studyRightId'})
  studyRight: SISStudyRight

  @Column(DataType.DATE)
  startDate: Date

  @Column(DataType.DATE)
  endDate: Date

  @Column(DataType.BOOLEAN)
  graduated: boolean

  @Column(DataType.INTEGER)
  phase: number

  @Column(DataType.STRING)
  studyRightId: string

  @Column(DataType.STRING)
  code: string

  @Column(DataType.JSONB)
  name: object

  @Column(DataType.JSONB)
  studyTrack: object

  @Column(DataType.DATE)
  createdAt: Date

  @Column(DataType.DATE)
  updatedAt: Date
}
