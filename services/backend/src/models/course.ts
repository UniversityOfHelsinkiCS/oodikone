import { Model, Table, Column, DataType, PrimaryKey } from "sequelize-typescript"

@Table({
  underscored: false,
  modelName: 'course',
  tableName: 'course',
})
export class Course extends Model {
  @PrimaryKey
  @Column(DataType.STRING)
  id: string

  @Column(DataType.STRING)
  code: string

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
  createdAt: Date
  
  @Column(DataType.DATE)
  updatedAt: Date

  @Column(DataType.JSONB)
  substitutions: object

  @Column(DataType.STRING)
  course_unit_type: string

  @Column(DataType.STRING)
  main_course_code: string
}
