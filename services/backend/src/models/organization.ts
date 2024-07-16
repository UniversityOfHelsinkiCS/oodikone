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

  @ForeignKey(() => SISStudyRight)
  @ForeignKey(() => Studyright)
  @Column(DataType.STRING)
  code: string

  @HasMany(() => SISStudyRight)
  SISStudyRights: SISStudyRight[]

  @HasMany(() => Studyright)
  studyrights: Studyright[]

  @Column(DataType.JSONB)
  name: Name

  @Column(DataType.STRING)
  parent_id: string

  @HasMany(() => Organization, { foreignKey: 'parent_id', as: 'children' })
  children: Organization[]

  @HasMany(() => ProgrammeModule, { foreignKey: 'organization_id' })
  programmeModules: ProgrammeModule[]

  @BelongsToMany(() => Course, () => CourseProvider, 'organizationcode')
  courses: Course[]

  @CreatedAt
  @Column(DataType.DATE)
  createdAt: Date

  @UpdatedAt
  @Column(DataType.DATE)
  updatedAt: Date
}
