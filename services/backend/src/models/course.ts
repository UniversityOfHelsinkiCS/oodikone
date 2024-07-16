/* eslint-disable import/no-cycle */
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

import { CourseProvider } from './courseProvider'
import { CourseType } from './courseType'
import { Credit } from './credit'
import { Enrollment } from './enrollment'
import { Organization } from './organization'

@Table({
  underscored: false,
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

  @BelongsTo(() => CourseType)
  courseType: CourseType

  @HasMany(() => Credit)
  credits: Credit[]

  @HasMany(() => Enrollment)
  enrollments: Enrollment[]

  @BelongsToMany(() => Organization, () => CourseProvider, 'coursecode')
  organizations: Organization[]

  @Column(DataType.BOOLEAN)
  is_study_module: boolean

  @Column(DataType.JSONB)
  name: object

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

  @CreatedAt
  @Column({
    field: 'created_at',
    type: DataType.DATE,
  })
  createdAt: Date

  @UpdatedAt
  @Column({
    field: 'updated_at',
    type: DataType.DATE,
  })
  updatedAt: Date

  @Column(DataType.JSONB)
  substitutions: object

  @Column(DataType.STRING)
  course_unit_type: string

  @Column({
    field: 'main_course_code',
    type: DataType.STRING,
  })
  mainCourseCode: string
}
