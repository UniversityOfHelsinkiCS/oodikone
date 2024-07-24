import { InferAttributes } from 'sequelize'
import { AutoIncrement, Column, DataType, Model, PrimaryKey, Table, Unique } from 'sequelize-typescript'

@Table({
  underscored: true,
  timestamps: true,
  modelName: 'study_guidance_group_tag',
  tableName: 'study_guidance_group_tags',
})
export class StudyGuidanceGroupTag extends Model<InferAttributes<StudyGuidanceGroupTag>> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  id!: string

  @Unique
  @Column(DataType.STRING)
  studyGuidanceGroupId!: string

  @Column(DataType.STRING)
  studyProgramme!: string

  @Column(DataType.STRING)
  year!: string
}
