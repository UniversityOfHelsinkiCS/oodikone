import {
  BelongsTo,
  BelongsToMany,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript'

import { Credit } from './credit'
import { Enrollment } from './enrollment'
import { Organization } from './organization'
import { CourseProvider } from './courseProvider'
import { CourseType } from './courseType'

@Table({
  underscored: true,
  modelName: 'course',
  tableName: 'course',
})
export class Course extends Model {
  @PrimaryKey
  @Column(DataType.STRING)
  id: string

  @ForeignKey(() => Course)
  @Column(DataType.STRING)
  code: string

  @ForeignKey(() => CourseType)
  @Column(DataType.STRING)
  coursetypecode: string

  @BelongsTo(() => CourseType, { foreignKey: 'coursetypecode', targetKey: 'coursetypecode' })
  courseType: CourseType

  @HasMany(() => Credit, { foreignKey: 'course_id', sourceKey: 'id' })
  credits: Credit[]

  @HasMany(() => Enrollment, { foreignKey: 'course_id' })
  enrollments: Enrollment[]

  // TODO not sure if this is correct: Should the field be organizations instead?
  // Then we would not have the provider share info?
  @BelongsToMany(() => Organization, () => CourseProvider, 'coursecode')
  courseProviders: CourseProvider[]

  @Column(DataType.STRING)
  name: string

  @Column(DataType.DATE)
  latest_instance_date: Date

  @Column(DataType.DATE)
  startdate: Date

  @Column(DataType.DATE)
  enddate: Date

  @Column(DataType.DATE)
  max_attainment_date: Date

  @Column(DataType.DATE)
  min_attainment_date: Date

  @Column(DataType.DATE)
  created_at: Date

  @Column(DataType.DATE)
  updated_at: Date

  @Column(DataType.JSONB)
  substitutions: object

  @Column(DataType.STRING)
  course_unit_type: string

  @Column(DataType.STRING)
  main_course_code: string
}
