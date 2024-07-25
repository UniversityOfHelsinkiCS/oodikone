import { CreationOptional, InferAttributes } from 'sequelize'
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
  id?: CreationOptional<string>

  @Unique
  @Column(DataType.STRING)
  studyGuidanceGroupId!: string

  @Column(DataType.STRING)
  studyProgramme!: string | null

  @Column(DataType.STRING)
  year!: string | null
}
