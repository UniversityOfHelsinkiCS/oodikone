import {
  BelongsTo,
  BelongsToMany,
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

import { CourseModel } from './course'
import { SISStudyRightModel } from './SISStudyRight'
import { StudentModel } from './student'
import { StudyplanCourseModel } from './studyplanCourse'

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

  // No db constraint: some included ids have no course row
  // can add later if DRAFTs etc brought to oodikone
  @BelongsToMany(() => CourseModel, {
    through: () => StudyplanCourseModel,
    foreignKey: 'studyplan_id',
    otherKey: 'course_id',
    as: 'courses',
    constraints: false,
  })
  declare courses: Studyplan['courses']

  @Column(DataType.STRING)
  declare sisu_id: Studyplan['sisu_id']

  @Column(DataType.DOUBLE)
  declare completed_credits: Studyplan['completed_credits']

  @Column(DataType.ARRAY(DataType.STRING))
  declare curriculum_period_ids: Studyplan['curriculum_period_ids']

  @CreatedAt
  @Column(DataType.DATE)
  declare createdAt: Studyplan['createdAt']

  @UpdatedAt
  @Column(DataType.DATE)
  declare updatedAt: Studyplan['updatedAt']
}
