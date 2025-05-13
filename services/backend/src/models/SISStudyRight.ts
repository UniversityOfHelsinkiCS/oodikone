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

import type {
  Credit,
  Enrollment,
  Organization,
  SISStudyRight,
  SISStudyRightElement,
  Student,
  Studyplan,
} from '@oodikone/shared/models'
import { ExtentCode, SemesterEnrollment } from '@oodikone/shared/types'

import { CreditModel } from './credit'
import { EnrollmentModel } from './enrollment'
import { OrganizationModel } from './organization'
import { SISStudyRightElementModel } from './SISStudyRightElement'
import { StudentModel } from './student'
import { StudyplanModel } from './studyplan'
import { StudyrightExtentModel } from './studyrightExtent'

@Table({
  underscored: true,
  tableName: 'sis_study_rights',
})
export class SISStudyRightModel extends Model<SISStudyRight> implements SISStudyRight {
  @PrimaryKey
  @Column(DataType.STRING)
  id!: string

  @ForeignKey(() => OrganizationModel)
  @Column(DataType.STRING)
  facultyCode!: string

  @BelongsTo(() => OrganizationModel, { foreignKey: 'facultyCode', targetKey: 'code' })
  organization!: Organization

  @HasMany(() => StudyplanModel)
  studyPlans!: Studyplan[]

  @HasMany(() => SISStudyRightElementModel, { foreignKey: 'studyRightId' })
  studyRightElements!: SISStudyRightElement[]

  @Column(DataType.DATE)
  startDate!: Date

  @Column(DataType.DATE)
  endDate!: Date

  @Column(DataType.DATE)
  studyStartDate!: Date

  @Column(DataType.BOOLEAN)
  cancelled!: boolean

  @Column(DataType.STRING)
  studentNumber!: string

  @BelongsTo(() => StudentModel, { foreignKey: 'studentNumber', targetKey: 'studentnumber' })
  student!: Student

  @ForeignKey(() => StudyrightExtentModel)
  @Column(DataType.INTEGER)
  extentCode!: ExtentCode

  @Column(DataType.STRING)
  admissionType!: string

  @Column(DataType.JSONB)
  semesterEnrollments!: SemesterEnrollment[] | null

  @HasMany(() => CreditModel, { foreignKey: 'studyright_id', sourceKey: 'id' })
  credits!: Credit[]

  @HasMany(() => EnrollmentModel, { foreignKey: 'studyright_id', sourceKey: 'id' })
  enrollments!: Enrollment[]

  @CreatedAt
  @Column(DataType.DATE)
  createdAt!: Date

  @UpdatedAt
  @Column(DataType.DATE)
  updatedAt!: Date
}
