import { InferAttributes } from 'sequelize'
import { Column, DataType, Model, PrimaryKey, Table } from 'sequelize-typescript'

@Table({
  underscored: true,
  timestamps: false,
  modelName: 'study_programme_pin',
  tableName: 'study_programme_pins',
})
export class StudyProgrammePin extends Model<InferAttributes<StudyProgrammePin>> {
  @PrimaryKey
  @Column(DataType.INTEGER)
  userId!: number

  @Column(DataType.ARRAY(DataType.STRING))
  studyProgrammes!: string[]
}
