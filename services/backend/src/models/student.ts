import { Model, Table, Column, PrimaryKey, DataType, HasMany } from 'sequelize-typescript'
import { Credit } from './credit'

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
  studyright_id: string

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
