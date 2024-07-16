/* eslint-disable import/no-cycle */
import {
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript'

import { EnrollmentType } from '../types/enrollmentType'
import { ExtentCode } from '../types/extentCode'
import { Organization } from './organization'
import { SISStudyRightElement } from './SISStudyRightElement'
import { Student } from './student'
import { Studyplan } from './studyplan'

type SemesterEnrollment = {
  type: EnrollmentType
  semester: number
  statutoryAbsence?: boolean
}

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

  @HasMany(() => Studyplan)
  studyPlans: Studyplan[]

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

  @ForeignKey(() => Student)
  @Column(DataType.STRING)
  studentNumber: string

  @BelongsTo(() => Student)
  student: Student

  @Column(DataType.INTEGER)
  extentCode: ExtentCode

  @Column(DataType.STRING)
  admissionType: string

  @Column(DataType.JSONB)
  semesterEnrollments: SemesterEnrollment[] | null

  @CreatedAt
  @Column(DataType.DATE)
  createdAt: Date

  @UpdatedAt
  @Column(DataType.DATE)
  updatedAt: Date
}
