import { Column, Table, DataType, Model, PrimaryKey, BelongsTo } from "sequelize-typescript"
import { Student } from "./student"
import { Semester } from "./semester"

@Table({
  underscored: false,
  modelName: 'enrollment',
  tableName: 'enrollment',
})
export class Enrollment extends Model {
  @PrimaryKey
  @Column(DataType.STRING)
  id: string

  @BelongsTo(() => Student, { foreignKey: 'studentnumber', targetKey: 'studentnumber' })
  student: Student

  @BelongsTo(() => Semester, { foreignKey: { name: 'semester_composite', allowNull: false } })
  semester: Semester

  @Column(DataType.STRING)
  studentnumber: string

  @Column(DataType.STRING)
  course_code: string

  @Column(DataType.STRING)
  state: string

  @Column(DataType.DATE)
  enrollment_date_time: string

  @Column(DataType.STRING)
  course_id: string

  @Column(DataType.STRING)
  semester_composite: string

  @Column(DataType.INTEGER)
  semestercode: string

  @Column(DataType.STRING)
  createdAt: string

  @Column(DataType.STRING)
  updatedAt: string

  @Column(DataType.STRING)
  is_open: string

  @Column(DataType.STRING)
  studyright_id: string
}
