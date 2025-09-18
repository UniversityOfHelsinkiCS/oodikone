import { Column, DataType, Model, PrimaryKey, Table } from 'sequelize-typescript'

import type { StudyProgrammePin } from '@oodikone/shared/models/kone'

@Table({
  underscored: true,
  timestamps: false,
  modelName: 'study_programme_pin',
  tableName: 'study_programme_pins',
})
export class StudyProgrammePinModel extends Model implements StudyProgrammePin {
  @PrimaryKey
  @Column(DataType.INTEGER)
  declare userId: StudyProgrammePin['userId']

  @Column(DataType.ARRAY(DataType.STRING))
  declare studyProgrammes: StudyProgrammePin['studyProgrammes']
}
