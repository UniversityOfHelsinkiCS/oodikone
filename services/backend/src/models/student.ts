/* eslint-disable import/no-cycle */
import { Column, CreatedAt, DataType, HasMany, Model, PrimaryKey, Table, UpdatedAt } from 'sequelize-typescript'

import { GenderCode } from '../types/genderCode'
import { Credit } from './credit'
import { Enrollment } from './enrollment'
import { SemesterEnrollment } from './semesterEnrollment'
import { SISStudyRight } from './SISStudyRight'
import { Studyplan } from './studyplan'
import { Studyright } from './studyright'
import { StudyrightElement } from './studyrightElement'
import { Transfer } from './transfer'

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

  @Column(DataType.STRING)
  abbreviatedname: string

  @HasMany(() => Enrollment, { foreignKey: 'studentnumber', sourceKey: 'studentnumber' })
  enrollments: Enrollment[]

  @HasMany(() => SemesterEnrollment)
  semester_enrollments: SemesterEnrollment[]

  @HasMany(() => SISStudyRight)
  studyRights: SISStudyRight[]

  @HasMany(() => Studyright)
  studyrights: Studyright[]

  @HasMany(() => StudyrightElement, { foreignKey: 'studentnumber', sourceKey: 'studentnumber' })
  studyrightElements: StudyrightElement[]

  @HasMany(() => Studyplan, { foreignKey: 'studentnumber', sourceKey: 'studentnumber' })
  studyplans: Studyplan[]

  @HasMany(() => Transfer, { foreignKey: 'studentnumber', sourceKey: 'studentnumber' })
  transfers: Transfer[]

  @HasMany(() => Credit, { foreignKey: 'student_studentnumber', sourceKey: 'studentnumber' })
  credits: Credit

  @Column(DataType.DATE)
  birthdate: Date

  @Column(DataType.INTEGER)
  creditcount: number

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
  gender_code: GenderCode

  @Column(DataType.STRING)
  sis_person_id: string

  @CreatedAt
  @Column(DataType.DATE)
  createdAt: Date

  @UpdatedAt
  @Column(DataType.DATE)
  updatedAt: Date
}
