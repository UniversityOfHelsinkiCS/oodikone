import {
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript'

import { Organization } from './organization'
import { SISStudyRightElement } from './SISStudyRightElement'
import { Student } from './student'
import { Studyplan } from './studyplan'

@Table({
  underscored: true,
  tableName: 'sis_study_rights',
})
export class SISStudyRight extends Model {
  @PrimaryKey
  @Column(DataType.STRING)
  id: string

  @BelongsTo(() => Organization, { foreignKey: 'facultyCode', targetKey: 'code' })
  organization: Organization

  @HasMany(() => Studyplan, { as: 'studyPlans', foreignKey: 'sis_study_right_id' })
  studyPlans: Studyplan[]

  @BelongsTo(() => Student, { foreignKey: 'studentNumber' })
  student: Student

  @HasMany(() => SISStudyRightElement, { foreignKey: 'studyRightId' })
  studyRightElements: SISStudyRightElement[]

  @Column(DataType.DATE)
  startDate: Date

  @Column(DataType.DATE)
  endDate: Date

  @Column(DataType.DATE)
  studyStartDate: Date

  @Column(DataType.BOOLEAN)
  cancelled: boolean

  @Column(DataType.STRING)
  studentNumber: string

  @Column(DataType.INTEGER)
  extentCode: number

  @Column(DataType.STRING)
  admissionType: string

  @Column(DataType.JSONB)
  semesterEnrollments: object

  @CreatedAt
  @Column(DataType.DATE)
  createdAt: Date

  @UpdatedAt
  @Column(DataType.DATE)
  updatedAt: Date
}
