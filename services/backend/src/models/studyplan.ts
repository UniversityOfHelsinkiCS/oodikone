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

import type { Studyplan } from '@oodikone/shared/models'

import { SISStudyRightModel } from './SISStudyRight'
import { StudentModel } from './student'

@Table({
  underscored: false,
  modelName: 'studyplan',
  tableName: 'studyplan',
})
export class StudyplanModel extends Model implements Studyplan {
  @PrimaryKey
  @Column(DataType.STRING)
  declare id: Studyplan['id']

  @ForeignKey(() => StudentModel)
  @Column(DataType.STRING)
  declare studentnumber: Studyplan['studentnumber']

  @BelongsTo(() => StudentModel, { foreignKey: 'studentnumber', targetKey: 'studentnumber' })
  declare student: Studyplan['student']

  @ForeignKey(() => SISStudyRightModel)
  @Column(DataType.STRING)
  declare sis_study_right_id: Studyplan['sis_study_right_id']

  @BelongsTo(() => SISStudyRightModel, { foreignKey: 'sis_study_right_id', targetKey: 'id', as: 'studyRight' })
  declare studyRight: Studyplan['studyRight']

  @Column(DataType.STRING)
  declare programme_code: Studyplan['programme_code']

  @Column(DataType.ARRAY(DataType.STRING))
  declare included_courses: Studyplan['included_courses']

  @Column({ type: DataType.ARRAY(DataType.TEXT), field: 'included_modules' })
  declare includedModules: Studyplan['includedModules']

  @Column(DataType.STRING)
  declare sisu_id: Studyplan['sisu_id']

  @Column(DataType.DOUBLE)
  declare completed_credits: Studyplan['completed_credits']

  @Column(DataType.STRING)
  declare curriculum_period_id: Studyplan['curriculum_period_id']

  @CreatedAt
  @Column(DataType.DATE)
  declare createdAt: Studyplan['createdAt']

  @UpdatedAt
  @Column(DataType.DATE)
  declare updatedAt: Studyplan['updatedAt']
}
