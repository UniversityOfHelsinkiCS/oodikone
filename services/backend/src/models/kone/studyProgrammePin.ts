import { Column, DataType, Model, PrimaryKey, Table } from 'sequelize-typescript'

import type { StudyProgrammePin } from '@oodikone/shared/models/kone'

@Table({
  underscored: true,
  timestamps: false,
  modelName: 'study_programme_pin',
  tableName: 'study_programme_pins',
})
export class StudyProgrammePinModel extends Model<StudyProgrammePin> implements StudyProgrammePin {
  @PrimaryKey
  @Column(DataType.INTEGER)
  userId!: number

  @Column(DataType.ARRAY(DataType.STRING))
  studyProgrammes!: string[]
}
