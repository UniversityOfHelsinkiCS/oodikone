/* eslint-disable import/no-cycle */
import {
  BelongsToMany,
  Column,
  CreatedAt,
  DataType,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript'

import { Name } from '../types'
import { Course } from './course'
import { CourseProvider } from './courseProvider'
import { ProgrammeModule } from './programmeModule'
import { SISStudyRight } from './SISStudyRight'
import { Studyright } from './studyright'

@Table({
  underscored: true,
  modelName: 'organization',
  tableName: 'organization',
})
export class Organization extends Model {
  @PrimaryKey
  @Column(DataType.STRING)
  id: string

  @Column(DataType.STRING)
  code: string

  @Column(DataType.JSONB)
  name: Name

  @Column(DataType.STRING)
  parent_id: string

  @HasMany(() => Organization, { foreignKey: 'parent_id', as: 'children' })
  children: Organization[]

  @HasMany(() => ProgrammeModule, { foreignKey: 'organization_id' })
  programmeModules: ProgrammeModule[]

  @HasMany(() => SISStudyRight, { foreignKey: 'facultyCode', sourceKey: 'code' })
  SISStudyRights: SISStudyRight[]

  @HasMany(() => Studyright, { foreignKey: 'facultyCode', sourceKey: 'code' })
  studyrights: Studyright[]

  @BelongsToMany(() => Course, () => CourseProvider, 'organizationcode')
  courses: Course[]

  @CreatedAt
  @Column(DataType.DATE)
  createdAt: Date

  @UpdatedAt
  @Column(DataType.DATE)
  updatedAt: Date
}
