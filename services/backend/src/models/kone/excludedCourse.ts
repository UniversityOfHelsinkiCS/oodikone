import { CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize'
import { Column, DataType, Model, PrimaryKey, Table, AutoIncrement, Default } from 'sequelize-typescript'

@Table({
  underscored: true,
  modelName: 'excluded_course',
  tableName: 'excluded_courses',
})
export class ExcludedCourse extends Model<InferAttributes<ExcludedCourse>, InferCreationAttributes<ExcludedCourse>> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: CreationOptional<number>

  @Column(DataType.STRING)
  programme_code!: string

  @Column(DataType.STRING)
  course_code!: string

  @Column(DataType.STRING)
  curriculum_version!: string

  @Default(DataType.NOW)
  @Column(DataType.DATE)
  createdAt!: CreationOptional<Date>

  @Default(DataType.NOW)
  @Column(DataType.DATE)
  updatedAt!: CreationOptional<Date>
}
