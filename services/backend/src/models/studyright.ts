import { Table, Model, DataType, Column, PrimaryKey, ForeignKey, HasMany } from 'sequelize-typescript'
import { Student } from './student'
import { StudyrightElement } from './studyrightElement'

@Table({
  modelName: 'studyright',
  tableName: 'studyright',
  timestamps: false
})
export class Studyright extends Model {
  @PrimaryKey
  @Column(DataType.INTEGER)
  studyrightid: string

  @HasMany(() => StudyrightElement)
  studyright_elements: StudyrightElement[]

  @ForeignKey(() => StudyrightElement)
  @Column(DataType.STRING)
  actual_studyrightid: string

  @Column(DataType.STRING)
  startdate: string

  @Column(DataType.DATE)
  enddate: Date

  @Column(DataType.DATE)
  givendate: Date

  @Column(DataType.STRING)
  studystartdate: string

  @Column(DataType.STRING)
  graduated: string

  @Column(DataType.STRING)
  active: string

  @Column(DataType.BOOLEAN)
  cancelled: boolean

  @ForeignKey(() => Student)
  @Column(DataType.STRING)
  student_studentnumber: string

  @Column(DataType.STRING)
  faculty_code: string

  @Column(DataType.INTEGER)
  prioritycode: number

  @Column(DataType.INTEGER)
  extentcode: number

  @Column({ field: 'created_at', type: DataType.DATE })
  created_at: Date

  @Column({ field: 'updated_at', type: DataType.DATE })
  updated_at: Date

  @Column(DataType.STRING)
  admission_type: string

  @Column(DataType.BOOLEAN)
  is_ba_ma: boolean

  @Column({ field: 'semester_enrollments', type: DataType.JSONB })
  semesterEnrollments: object
}
