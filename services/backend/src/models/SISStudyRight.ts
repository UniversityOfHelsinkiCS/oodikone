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

import type { SISStudyRight } from '@oodikone/shared/models'

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
export class SISStudyRightModel extends Model implements SISStudyRight {
  @PrimaryKey
  @Column(DataType.STRING)
  declare id: SISStudyRight['id']

  @ForeignKey(() => OrganizationModel)
  @Column(DataType.STRING)
  declare facultyCode: SISStudyRight['facultyCode']

  @BelongsTo(() => OrganizationModel, { foreignKey: 'facultyCode', targetKey: 'code' })
  declare organization: SISStudyRight['organization']

  @HasMany(() => StudyplanModel)
  declare studyPlans: SISStudyRight['studyPlans']

  @HasMany(() => SISStudyRightElementModel, { foreignKey: 'studyRightId' })
  declare studyRightElements: SISStudyRight['studyRightElements']

  @Column(DataType.DATE)
  declare startDate: SISStudyRight['startDate']

  @Column(DataType.DATE)
  declare endDate: SISStudyRight['endDate']

  @Column(DataType.DATE)
  declare studyStartDate: SISStudyRight['studyStartDate']

  @Column(DataType.BOOLEAN)
  declare cancelled: SISStudyRight['cancelled']

  @Column(DataType.STRING)
  declare studentNumber: SISStudyRight['studentNumber']

  @BelongsTo(() => StudentModel, { foreignKey: 'studentNumber', targetKey: 'studentnumber' })
  declare student: SISStudyRight['student']

  @ForeignKey(() => StudyrightExtentModel)
  @Column(DataType.INTEGER)
  declare extentCode: SISStudyRight['extentCode']

  @Column(DataType.STRING)
  declare admissionType: SISStudyRight['admissionType']

  @Column(DataType.JSONB)
  declare semesterEnrollments: SISStudyRight['semesterEnrollments']

  @HasMany(() => CreditModel, { foreignKey: 'studyright_id', sourceKey: 'id' })
  declare credits: SISStudyRight['credits']

  @HasMany(() => EnrollmentModel, { foreignKey: 'studyright_id', sourceKey: 'id' })
  declare enrollments: SISStudyRight['enrollments']

  @Column(DataType.BOOLEAN)
  declare tvex: SISStudyRight['tvex']

  @Column(DataType.ARRAY(DataType.STRING))
  declare expirationRuleUrns: SISStudyRight['expirationRuleUrns']

  @CreatedAt
  @Column(DataType.DATE)
  declare createdAt: SISStudyRight['createdAt']

  @UpdatedAt
  @Column(DataType.DATE)
  declare updatedAt: SISStudyRight['updatedAt']
}
