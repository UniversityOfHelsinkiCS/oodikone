import { BelongsToMany, Column, DataType, HasMany, Model, PrimaryKey, Table } from "sequelize-typescript"
import { ProgrammeModule } from "./programmeModule"
import { CourseProvider } from "./courseProvider"
import { Course } from "./course"

@Table({
  underscored: true,
  modelName: 'organization',
  tableName: 'organization',
})
export class Organization extends Model {
  @PrimaryKey
  @Column(DataType.STRING)
  id: string

  @HasMany(() => ProgrammeModule, { foreignKey: 'organization_id' })
  programmeModules: ProgrammeModule[]

  @BelongsToMany(() => Course, () => CourseProvider, 'organizationcode')
  courses: Course[]
  
  @Column(DataType.STRING)
  code: string

  @Column(DataType.STRING)
  name: object

  @Column(DataType.STRING)
  parent_id: string

  @Column(DataType.DATE)
  createdAt: Date

  @Column(DataType.DATE)
  updatedAt: Date
  
}
