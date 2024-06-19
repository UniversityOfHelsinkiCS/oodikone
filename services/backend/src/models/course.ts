import { Model, Table, Column, DataType, PrimaryKey, ForeignKey, HasMany, BelongsToMany } from "sequelize-typescript"
import { Credit } from "./credit"
import { Organization } from "./organization"
import { CourseProvider } from "./courseProvider"

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

  @HasMany(() => Credit, { foreignKey: 'course_id', sourceKey: 'id' })
  credits: Credit[]

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
