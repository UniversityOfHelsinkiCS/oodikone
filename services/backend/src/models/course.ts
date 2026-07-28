import {
  BelongsTo,
  BelongsToMany,
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

import type { Course } from '@oodikone/shared/models'

import { CourseProviderModel } from './courseProvider'
import { CourseTypeModel } from './courseType'
import { CreditModel } from './credit'
import { EnrollmentModel } from './enrollment'
import { OrganizationModel } from './organization'

@Table({
  underscored: true,
  modelName: 'course',
  tableName: 'course',
})
export class CourseModel extends Model implements Course {
  /* COLUMNS */
  @PrimaryKey
  @Column(DataType.STRING)
  declare id: Course['id']

  @Column(DataType.STRING)
  declare groupId: Course['id']

  @ForeignKey(() => CourseModel)
  @Column(DataType.STRING)
  declare code: Course['code']

  @ForeignKey(() => CourseTypeModel)
  @Column(DataType.STRING)
  declare coursetypecode: Course['coursetypecode']

  @Column(DataType.BOOLEAN)
  declare isStudyModule: Course['isStudyModule']

  @Column(DataType.JSONB)
  declare name: Course['name']

  @Column(DataType.DATE)
  declare maxAttainmentDate: Course['maxAttainmentDate']

  @Column(DataType.DATE)
  declare minAttainmentDate: Course['minAttainmentDate']

  @CreatedAt
  @Column({ field: 'created_at', type: DataType.DATE })
  declare createdAt: Course['createdAt']

  @UpdatedAt
  @Column({ field: 'updated_at', type: DataType.DATE })
  declare updatedAt: Course['updatedAt']

  @Column(DataType.JSONB)
  declare validityPeriod: Course['validityPeriod']

  @Column(DataType.JSONB)
  declare substitutionGroups: Course['substitutionGroups']

  @Column(DataType.BOOLEAN)
  declare isPrimary: Course['isPrimary']

  @Column(DataType.STRING)
  declare courseUnitType: Course['courseUnitType']

  /* RELATIONS */
  @BelongsTo(() => CourseTypeModel, { foreignKey: 'coursetypecode', targetKey: 'coursetypecode' })
  declare courseType: Course['courseType']

  @HasMany(() => CreditModel, { foreignKey: 'course_id', sourceKey: 'id' })
  declare credits: Course['credits']

  @HasMany(() => EnrollmentModel, { foreignKey: 'course_id' })
  declare enrollments: Course['enrollments']

  @BelongsToMany(() => OrganizationModel, () => CourseProviderModel, 'coursecode')
  declare organizations: Course['organizations']
}
