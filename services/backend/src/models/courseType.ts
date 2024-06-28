import { Model, Table, Column, DataType, PrimaryKey, HasMany } from "sequelize-typescript"
import { Course } from "./course"

@Table({
  underscored: true,
  modelName: 'course_type',
  tableName: 'course_types',
})
export class CourseType extends Model {
  @PrimaryKey
  @Column(DataType.STRING)
  coursetypecode: string

  @HasMany(() => Course)
  courses: Course[]

  @Column(DataType.JSONB)
  type: object

  @Column(DataType.DATE)
  createdAt: Date

  @Column(DataType.DATE)
  updatedAt: Date
}
