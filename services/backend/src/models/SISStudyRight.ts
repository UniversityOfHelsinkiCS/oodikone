import { BelongsTo, Column, DataType, HasMany, Model, PrimaryKey, Table } from 'sequelize-typescript'
import { Organization } from './organization'
import { Studyplan } from './studyplan'
import { Student } from './student'
import { SISStudyRightElement } from './SISStudyRightElement'

@Table({
  underscored: true,
  tableName: 'sis_study_rights',
})
export class SISStudyRight extends Model {
  @PrimaryKey
  @Column(DataType.STRING)
  id!: string

  @BelongsTo(() => Organization, { foreignKey: 'facultyCode', targetKey: 'code' })
  organization: Organization

  @HasMany(() => Studyplan, { as: 'studyPlans', foreignKey: 'sis_study_right_id' })
  studyplans: Studyplan[]

  @BelongsTo(() => Student, { foreignKey: 'studentNumber' })
  student: Student

  @HasMany(() => SISStudyRightElement, { foreignKey: 'studyRightId' })
  studyrightElements: SISStudyRightElement[]

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

  @Column(DataType.BOOLEAN)
  facultyCode: boolean

  @Column(DataType.DATE)
  createdAt: Date

  @Column(DataType.DATE)
  updatedAt: Date
}
