import { CreationOptional } from 'sequelize'
import { AutoIncrement, Column, DataType, Model, PrimaryKey, Table, Unique } from 'sequelize-typescript'

import type { StudyGuidanceGroupTag, StudyGuidanceGroupTagCreation } from '@oodikone/shared/models/kone'

@Table({
  underscored: true,
  timestamps: true,
  modelName: 'study_guidance_group_tag',
  tableName: 'study_guidance_group_tags',
})
export class StudyGuidanceGroupTagModel
  extends Model<StudyGuidanceGroupTag, StudyGuidanceGroupTagCreation>
  implements StudyGuidanceGroupTag
{
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  id?: CreationOptional<string>

  @Unique
  @Column(DataType.STRING)
  studyGuidanceGroupId!: string

  @Column(DataType.STRING)
  studyProgramme!: string | null

  @Column(DataType.STRING)
  year!: string | null
}
