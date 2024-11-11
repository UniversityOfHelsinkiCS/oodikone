import { InferAttributes } from 'sequelize'
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

import { Student, SISStudyRight } from '.'

@Table({
  underscored: false,
  modelName: 'studyplan',
  tableName: 'studyplan',
})
export class Studyplan extends Model<InferAttributes<Studyplan>> {
  @PrimaryKey
  @Column(DataType.STRING)
  id!: string

  @ForeignKey(() => Student)
  @Column(DataType.STRING)
  studentnumber!: string

  @BelongsTo(() => Student, { foreignKey: 'studentnumber', targetKey: 'studentnumber' })
  student!: Student

  @ForeignKey(() => SISStudyRight)
  @Column(DataType.STRING)
  sis_study_right_id!: string

  @BelongsTo(() => SISStudyRight, { foreignKey: 'sis_study_right_id', targetKey: 'id', as: 'studyRight' })
  studyRight!: SISStudyRight

  @Column(DataType.STRING)
  programme_code!: string

  @Column(DataType.ARRAY(DataType.STRING))
  included_courses!: string[]

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
