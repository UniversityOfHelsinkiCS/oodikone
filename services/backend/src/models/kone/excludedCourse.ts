import { InferAttributes } from 'sequelize'
import { AutoIncrement, Column, DataType, Model, PrimaryKey, Table } from 'sequelize-typescript'

@Table({
  underscored: true,
  modelName: 'excluded_course',
  tableName: 'excluded_courses',
})
export class ExcludedCourse extends Model<InferAttributes<ExcludedCourse>> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number

  @Column(DataType.STRING)
  programme_code!: string

  @Column(DataType.STRING)
  course_code!: string

  @Column(DataType.STRING)
  curriculum_version!: string

  @Column(DataType.DATE)
  createdAt!: Date

  @Column(DataType.DATE)
  updatedAt!: Date
}
