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

import { Enrollment } from './enrollment'
import { Organization } from './organization'
import { Student } from './student'
import { Studyplan } from './studyplan'
import { StudyrightElement } from './studyrightElement'
import { StudyrightExtent } from './studyrightExtent'
import { Transfer } from './transfer'

@Table({
  modelName: 'studyright',
  tableName: 'studyright',
  timestamps: false,
})
export class Studyright extends Model {
  @PrimaryKey
  @Column(DataType.INTEGER)
  studyrightid: string

  @HasMany(() => StudyrightElement, { foreignKey: 'studyrightid', sourceKey: 'studyrightid' })
  studyright_elements: StudyrightElement[]

  @BelongsTo(() => StudyrightExtent, { foreignKey: 'extentcode', targetKey: 'extentcode' })
  studyrightExtent: StudyrightExtent

  @ForeignKey(() => StudyrightElement)
  @Column(DataType.STRING)
  actual_studyrightid: string

  @HasMany(() => Enrollment, { foreignKey: 'studyright_id', constraints: false })
  enrollments: Enrollment[]

  @BelongsTo(() => Student, { foreignKey: 'studentStudentnumber', targetKey: 'studentnumber' })
  student: Student

  @BelongsTo(() => Organization, { targetKey: 'code' })
  organization: Organization

  @HasMany(() => Transfer, { foreignKey: 'studyrightid', sourceKey: 'studyrightid' })
  transfers: Transfer[]

  @HasMany(() => Studyplan, { foreignKey: 'studyrightid', sourceKey: 'studyrightid' })
  studyplans: Studyplan[]

  @Column(DataType.STRING)
  startdate: string

  @Column(DataType.DATE)
  enddate: Date

  @Column(DataType.DATE)
  givendate: Date

  @Column(DataType.STRING)
  studystartdate: string

  @Column(DataType.STRING)
  graduated: string

  @Column(DataType.STRING)
  active: string

  @Column(DataType.BOOLEAN)
  cancelled: boolean

  @ForeignKey(() => Student)
  @Column({ field: 'student_studentnumber', type: DataType.STRING })
  studentStudentnumber: string

  @ForeignKey(() => Organization)
  @Column({ field: 'faculty_code', type: DataType.STRING })
  facultyCode: string

  @Column(DataType.INTEGER)
  prioritycode: number

  @Column(DataType.INTEGER)
  extentcode: number

  @Column(DataType.STRING)
  admission_type: string

  @Column(DataType.BOOLEAN)
  is_ba_ma: boolean

  @Column({ field: 'semester_enrollments', type: DataType.JSONB })
  semesterEnrollments: object

  @CreatedAt
  @Column({ field: 'created_at', type: DataType.DATE })
  created_at: Date

  @UpdatedAt
  @Column({ field: 'updated_at', type: DataType.DATE })
  updated_at: Date
}