import { Model, Table, Column, PrimaryKey, DataType, HasMany } from 'sequelize-typescript'
import { Credit } from './credit'
import { SemesterEnrollment } from './semesterEnrollment'
import { Studyplan } from './studyplan'
import { Transfer } from './transfer'
import { Studyright } from './studyright'
import { Enrollment } from './enrollment'

@Table({
  underscored: true,
  modelName: 'student',
  tableName: 'student',
})
export class Student extends Model {
  @PrimaryKey
  @Column(DataType.STRING)
  studentnumber: string

  @Column(DataType.STRING)
  lastname: string

  @Column(DataType.STRING)
  firstnames: string

  @HasMany(() => Studyright)
  studyrights: Studyright[]

  @HasMany(() => Enrollment, { foreignKey: 'studentnumber', sourceKey: 'studentnumber' })
  enrollments: Enrollment[]
  
  @Column(DataType.STRING)
  abbreviatedname: string

  @HasMany(() => Studyplan)
  studyplans: Studyplan[]

  @HasMany(() => Transfer)
  transfers: Transfer[]

  @Column(DataType.DATE)
  birthdate: Date

  @Column(DataType.STRING)
  creditcount: string

  @Column(DataType.DATE)
  dateofuniversityenrollment: Date

  @Column(DataType.STRING)
  email: string

  @Column(DataType.STRING)
  secondary_email: string

  @HasMany(() => SemesterEnrollment)
  semester_enrollments: SemesterEnrollment[]

  @Column(DataType.STRING)
  national_student_number: string

  @Column(DataType.STRING)
  phone_number: string

  @Column(DataType.STRING)
  country_fi: string

  @Column(DataType.STRING)
  country_sv: string

  @Column(DataType.STRING)
  country_en: string

  @Column(DataType.STRING)
  home_country_fi: string

  @Column(DataType.STRING)
  home_country_sv: string

  @Column(DataType.STRING)
  home_country_en: string

  @Column(DataType.STRING)
  gender_code: string

  @Column(DataType.STRING)
  sis_person_id: string

  @Column(DataType.DATE)
  createdAt: Date

  @Column(DataType.DATE)
  updatedAt: Date

  @HasMany(() => Credit)
  credits: Credit
}
