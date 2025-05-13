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

import type { SISStudyRight, Student, Studyplan } from '@oodikone/shared/models'

import { SISStudyRightModel } from './SISStudyRight'
import { StudentModel } from './student'

@Table({
  underscored: false,
  modelName: 'studyplan',
  tableName: 'studyplan',
})
export class StudyplanModel extends Model<Studyplan> implements Studyplan {
  @PrimaryKey
  @Column(DataType.STRING)
  id!: string

  @ForeignKey(() => StudentModel)
  @Column(DataType.STRING)
  studentnumber!: string

  @BelongsTo(() => StudentModel, { foreignKey: 'studentnumber', targetKey: 'studentnumber' })
  student!: Student

  @ForeignKey(() => SISStudyRightModel)
  @Column(DataType.STRING)
  sis_study_right_id!: string

  @BelongsTo(() => SISStudyRightModel, { foreignKey: 'sis_study_right_id', targetKey: 'id', as: 'studyRight' })
  studyRight!: SISStudyRight

  @Column(DataType.STRING)
  programme_code!: string

  @Column(DataType.ARRAY(DataType.STRING))
  included_courses!: string[]

  @Column({ type: DataType.ARRAY(DataType.TEXT), field: 'included_modules' })
  includedModules!: string[]

  @Column(DataType.STRING)
  sisu_id!: string

  @Column(DataType.DOUBLE)
  completed_credits!: number

  @Column(DataType.STRING)
  curriculum_period_id!: string

  @CreatedAt
  @Column(DataType.DATE)
  createdAt!: Date

  @UpdatedAt
  @Column(DataType.DATE)
  updatedAt!: Date
}
