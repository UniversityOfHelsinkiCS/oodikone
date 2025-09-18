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
  underscored: false,
  modelName: 'course',
  tableName: 'course',
})
export class CourseModel extends Model implements Course {
  @PrimaryKey
  @Column(DataType.STRING)
  declare id: Course['id']

  @ForeignKey(() => CourseModel)
  @Column(DataType.STRING)
  declare code: Course['code']

  @ForeignKey(() => CourseTypeModel)
  @Column(DataType.STRING)
  declare coursetypecode: Course['coursetypecode']

  @BelongsTo(() => CourseTypeModel, { foreignKey: 'coursetypecode', targetKey: 'coursetypecode' })
  declare courseType: Course['courseType']

  @HasMany(() => CreditModel, { foreignKey: 'course_id', sourceKey: 'id' })
  declare credits: Course['credits']

  @HasMany(() => EnrollmentModel, { foreignKey: 'course_id' })
  declare enrollments: Course['enrollments']

  @BelongsToMany(() => OrganizationModel, () => CourseProviderModel, 'coursecode')
  declare organizations: Course['organizations']

  @Column(DataType.BOOLEAN)
  declare is_study_module: Course['is_study_module']

  @Column(DataType.JSONB)
  declare name: Course['name']

  @Column(DataType.DATE)
  declare max_attainment_date: Course['max_attainment_date']

  @Column(DataType.DATE)
  declare min_attainment_date: Course['min_attainment_date']

  @CreatedAt
  @Column({ field: 'created_at', type: DataType.DATE })
  declare createdAt: Course['createdAt']

  @UpdatedAt
  @Column({ field: 'updated_at', type: DataType.DATE })
  declare updatedAt: Course['updatedAt']

  @Column(DataType.JSONB)
  declare substitutions: Course['substitutions']

  @Column(DataType.STRING)
  declare course_unit_type: Course['course_unit_type']

  @Column({ field: 'main_course_code', type: DataType.STRING })
  declare mainCourseCode: Course['mainCourseCode']
}
