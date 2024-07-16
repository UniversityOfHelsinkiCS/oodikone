/* eslint-disable import/no-cycle */
import {
  BelongsToMany,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript'

import { Name } from '../types/name'
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

  @ForeignKey(() => Organization)
  @Column(DataType.STRING)
  parent_id: string

  @HasMany(() => Organization)
  children: Organization[]

  @HasMany(() => ProgrammeModule)
  programmeModules: ProgrammeModule[]

  @HasMany(() => SISStudyRight)
  SISStudyRights: SISStudyRight[]

  @HasMany(() => Studyright)
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
