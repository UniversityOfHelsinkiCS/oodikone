import { AutoIncrement, Column, DataType, Model, PrimaryKey, Table, Unique } from 'sequelize-typescript'

import type { StudyGuidanceGroupTag } from '@oodikone/shared/models/kone'

@Table({
  underscored: true,
  timestamps: true,
  modelName: 'study_guidance_group_tag',
  tableName: 'study_guidance_group_tags',
})
export class StudyGuidanceGroupTagModel extends Model implements StudyGuidanceGroupTag {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  declare id: StudyGuidanceGroupTag['id']

  @Unique
  @Column(DataType.STRING)
  declare studyGuidanceGroupId: StudyGuidanceGroupTag['studyGuidanceGroupId']

  @Column(DataType.STRING)
  declare studyProgramme: StudyGuidanceGroupTag['studyProgramme']

  @Column(DataType.STRING)
  declare year: StudyGuidanceGroupTag['year']
}
