import { Column, DataType, Model, PrimaryKey, Table, Unique } from 'sequelize-typescript'

@Table({
  underscored: true,
  timestamps: true,
  modelName: 'study_guidance_group_tag',
  tableName: 'study_guidance_group_tags',
})
export class StudyGuidanceGroupTag extends Model {
  @PrimaryKey
  @Column(DataType.BIGINT)
  id!: bigint

  @Unique
  @Column(DataType.STRING)
  studyGuidanceGroupId: string

  @Column(DataType.STRING)
  studyProgramme: string

  @Column(DataType.STRING)
  year: string
}
