import { Column, CreatedAt, DataType, HasMany, Model, PrimaryKey, Table, UpdatedAt } from 'sequelize-typescript'

import type { Student } from '@oodikone/shared/models'

import { CreditModel } from './credit'
import { EnrollmentModel } from './enrollment'
import { SISStudyRightModel } from './SISStudyRight'
import { StudyplanModel } from './studyplan'

@Table({
  underscored: true,
  modelName: 'student',
  tableName: 'student',
})
export class StudentModel extends Model implements Student {
  @PrimaryKey
  @Column(DataType.STRING)
  declare studentnumber: Student['studentnumber']

  @Column(DataType.STRING)
  declare lastname: Student['lastname']

  @Column(DataType.STRING)
  declare firstnames: Student['firstnames']

  @Column(DataType.STRING)
  declare abbreviatedname: Student['abbreviatedname']

  @HasMany(() => EnrollmentModel, { foreignKey: 'studentnumber', sourceKey: 'studentnumber' })
  declare enrollments: Student['enrollments']

  @HasMany(() => SISStudyRightModel, { foreignKey: 'studentNumber', sourceKey: 'studentnumber' })
  declare studyRights: Student['studyRights']

  @HasMany(() => StudyplanModel, { foreignKey: 'studentnumber', sourceKey: 'studentnumber' })
  declare studyplans: Student['studyplans']

  @HasMany(() => CreditModel, { foreignKey: 'student_studentnumber', sourceKey: 'studentnumber' })
  declare credits: Student['credits']

  @Column(DataType.DATE)
  declare birthdate: Student['birthdate']

  @Column(DataType.INTEGER)
  declare creditcount: Student['creditcount']

  @Column(DataType.DATE)
  declare dateofuniversityenrollment: Student['dateofuniversityenrollment']

  @Column(DataType.STRING)
  declare email: Student['email']

  @Column(DataType.STRING)
  declare secondary_email: Student['secondary_email']

  @Column(DataType.STRING)
  declare national_student_number: Student['national_student_number']

  @Column(DataType.STRING)
  declare phone_number: Student['phone_number']

  @Column(DataType.JSONB)
  declare citizenships: Student['citizenships']

  @Column(DataType.STRING)
  declare gender_code: Student['gender_code']

  @Column(DataType.STRING)
  declare sis_person_id: Student['sis_person_id']

  @Column(DataType.BOOLEAN)
  declare hasPersonalIdentityCode: Student['hasPersonalIdentityCode']

  @Column(DataType.STRING)
  declare preferredLanguage: Student['preferredLanguage']

  @CreatedAt
  @Column(DataType.DATE)
  declare createdAt: Student['createdAt']

  @UpdatedAt
  @Column(DataType.DATE)
  declare updatedAt: Student['updatedAt']
}
