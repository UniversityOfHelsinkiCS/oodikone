import { Model, Table, Column, PrimaryKey, DataType, HasMany } from 'sequelize-typescript'
import { Credit } from './credit'
import { SemesterEnrollment } from './semesterEnrollment'
import { Studyplan } from './studyplan'
import { Transfer } from './transfer'
import { Studyright } from './studyright'
import { Enrollment } from './enrollment'
import { SISStudyRight } from './SISStudyRight'
import { StudyrightElement } from './studyrightElement'

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


  
  @HasMany(() => Studyright, { foreignKey: 'studentStudentnumber', sourceKey: 'studentnumber' })
  studyrights: Studyright[]

  @HasMany(() => Enrollment, { foreignKey: 'studentnumber', sourceKey: 'studentnumber' })
  enrollments: Enrollment[]
  
  @HasMany(() => SISStudyRight, { foreignKey: 'studentNumber' })
  studyRights: SISStudyRight[]

  @HasMany(() => SemesterEnrollment, { foreignKey: 'studentnumber', sourceKey: 'studentnumber' })
  semester_enrollments: SemesterEnrollment[]

  @HasMany(() => StudyrightElement, { foreignKey: 'studentnumber', sourceKey: 'studentnumber' })
  studyrightElements: StudyrightElement[]

  @Column(DataType.STRING)
  abbreviatedname: string

  @HasMany(() => Studyplan)
  studyplans: Studyplan[]

  @HasMany(() => Transfer, { foreignKey: 'studentnumber', sourceKey: 'studentnumber' })
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
