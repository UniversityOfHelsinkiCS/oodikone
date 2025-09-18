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

import type { Organization } from '@oodikone/shared/models'

import { CourseModel } from './course'
import { CourseProviderModel } from './courseProvider'
import { ProgrammeModuleModel } from './programmeModule'
import { SISStudyRightModel } from './SISStudyRight'

@Table({
  underscored: true,
  modelName: 'organization',
  tableName: 'organization',
})
export class OrganizationModel extends Model implements Organization {
  @PrimaryKey
  @Column(DataType.STRING)
  declare id: Organization['id']

  @Column(DataType.STRING)
  declare code: Organization['code']

  @Column(DataType.JSONB)
  declare name: Organization['name']

  @Column(DataType.STRING)
  declare parent_id: Organization['parent_id']

  @HasMany(() => OrganizationModel, { foreignKey: 'parent_id', as: 'children' })
  declare children: Organization['children']

  @HasMany(() => ProgrammeModuleModel, { foreignKey: 'organization_id' })
  declare programmeModules: Organization['programmeModules']

  @HasMany(() => SISStudyRightModel, { foreignKey: 'facultyCode', sourceKey: 'code' })
  declare SISStudyRights: Organization['SISStudyRights']

  @BelongsToMany(() => CourseModel, () => CourseProviderModel, 'organizationcode')
  declare courses: Organization['courses']

  @CreatedAt
  @Column(DataType.DATE)
  declare createdAt: Organization['createdAt']

  @UpdatedAt
  @Column(DataType.DATE)
  declare updatedAt: Organization['updatedAt']
}
