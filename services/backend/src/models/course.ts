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

import type { Course, CourseType, Credit, Enrollment, Organization } from '@oodikone/shared/models'
import type { Name } from '@oodikone/shared/types'

import { CourseProviderModel } from './courseProvider'
import { CourseTypeModel } from './courseType'
import { CreditModel } from './credit'
import { EnrollmentModel } from './enrollment'
import { OrganizationModel } from './organization'

@Table({
  underscored: false,
  modelName: 'course',
  tableName: 'course',
})
export class CourseModel extends Model<Course> implements Course {
  @PrimaryKey
  @Column(DataType.STRING)
  id!: string

  @ForeignKey(() => CourseModel)
  @Column(DataType.STRING)
  code!: string

  @ForeignKey(() => CourseTypeModel)
  @Column(DataType.STRING)
  coursetypecode!: string

  @BelongsTo(() => CourseTypeModel, { foreignKey: 'coursetypecode', targetKey: 'coursetypecode' })
  courseType!: CourseType

  @HasMany(() => CreditModel, { foreignKey: 'course_id', sourceKey: 'id' })
  credits!: Credit[]

  @HasMany(() => EnrollmentModel, { foreignKey: 'course_id' })
  enrollments!: Enrollment[]

  @BelongsToMany(() => OrganizationModel, () => CourseProviderModel, 'coursecode')
  organizations!: Organization[]

  @Column(DataType.BOOLEAN)
  is_study_module!: boolean

  @Column(DataType.JSONB)
  name!: Name

  @Column(DataType.DATE)
  max_attainment_date!: Date

  @Column(DataType.DATE)
  min_attainment_date!: Date

  @CreatedAt
  @Column({ field: 'created_at', type: DataType.DATE })
  createdAt!: Date

  @UpdatedAt
  @Column({ field: 'updated_at', type: DataType.DATE })
  updatedAt!: Date

  @Column(DataType.JSONB)
  substitutions!: string[]

  @Column(DataType.STRING)
  course_unit_type!: string

  @Column({ field: 'main_course_code', type: DataType.STRING })
  mainCourseCode!: string
}
