import { Column, CreatedAt, DataType, HasMany, Model, PrimaryKey, Table, UpdatedAt } from 'sequelize-typescript'

import type { Student, Credit, Enrollment, SISStudyRight, Studyplan } from '@oodikone/shared/models'
import type { Name } from '@oodikone/shared/types'
import { GenderCode } from '@oodikone/shared/types'

import { CreditModel } from './credit'
import { EnrollmentModel } from './enrollment'
import { SISStudyRightModel } from './SISStudyRight'
import { StudyplanModel } from './studyplan'

@Table({
  underscored: true,
  modelName: 'student',
  tableName: 'student',
})
export class StudentModel extends Model<Student> implements Student {
  @PrimaryKey
  @Column(DataType.STRING)
  studentnumber!: string

  @Column(DataType.STRING)
  lastname!: string

  @Column(DataType.STRING)
  firstnames!: string

  @Column(DataType.STRING)
  abbreviatedname!: string

  @HasMany(() => EnrollmentModel, { foreignKey: 'studentnumber', sourceKey: 'studentnumber' })
  enrollments!: Enrollment[]

  @HasMany(() => SISStudyRightModel, { foreignKey: 'studentNumber', sourceKey: 'studentnumber' })
  studyRights!: SISStudyRight[]

  @HasMany(() => StudyplanModel, { foreignKey: 'studentnumber', sourceKey: 'studentnumber' })
  studyplans!: Studyplan[]

  @HasMany(() => CreditModel, { foreignKey: 'student_studentnumber', sourceKey: 'studentnumber' })
  credits!: Credit[]

  @Column(DataType.DATE)
  birthdate!: Date

  @Column(DataType.INTEGER)
  creditcount!: number

  @Column(DataType.DATE)
  dateofuniversityenrollment!: Date

  @Column(DataType.STRING)
  email!: string

  @Column(DataType.STRING)
  secondary_email!: string

  @Column(DataType.STRING)
  national_student_number!: string

  @Column(DataType.STRING)
  phone_number!: string

  @Column(DataType.JSONB)
  citizenships!: Name[]

  @Column(DataType.STRING)
  gender_code!: GenderCode

  @Column(DataType.STRING)
  sis_person_id!: string

  @Column(DataType.BOOLEAN)
  hasPersonalIdentityCode!: boolean

  @Column(DataType.STRING)
  preferredLanguage!: string

  @CreatedAt
  @Column(DataType.DATE)
  createdAt!: Date

  @UpdatedAt
  @Column(DataType.DATE)
  updatedAt!: Date
}
