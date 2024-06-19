import { Table, Model, DataType, Column, PrimaryKey, ForeignKey, HasMany } from "sequelize-typescript"
import { Student } from "./student"
import { StudyrightElement } from "./studyrightElement"

@Table({
  underscored: true,
  modelName: 'studyright',
  tableName: 'studyright',
})
export class Studyright extends Model {
  @PrimaryKey
  @Column(DataType.INTEGER)
  studyrightid: string

  @HasMany(() => StudyrightElement)
  studyrightElements: StudyrightElement[]

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
  studentStudentnumber: string

  @Column(DataType.STRING)
  facultyCode: string
  
  @Column(DataType.INTEGER)
  prioritycode: number
  
  @Column(DataType.INTEGER)
  extentcode: number
  
  @Column(DataType.DATE)
  createdAt: Date
  
  @Column(DataType.DATE)
  updatedAt: Date
  
  @Column(DataType.STRING)
  admission_type: string
  
  @Column(DataType.BOOLEAN)
  is_ba_ma: boolean
  
  @Column(DataType.JSONB)
  semesterEnrollments: object
}
