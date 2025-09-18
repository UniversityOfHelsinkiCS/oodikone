import { Column, CreatedAt, DataType, Model, PrimaryKey, Table, UpdatedAt } from 'sequelize-typescript'

import type { StudyrightExtent } from '@oodikone/shared/models'

@Table({
  underscored: true,
  modelName: 'studyright_extent',
  tableName: 'studyright_extents',
})
export class StudyrightExtentModel extends Model implements StudyrightExtent {
  @PrimaryKey
  @Column(DataType.INTEGER)
  declare extentcode: StudyrightExtent['extentcode']

  @Column(DataType.STRING)
  declare name: StudyrightExtent['name']

  @CreatedAt
  @Column(DataType.DATE)
  declare createdAt: StudyrightExtent['createdAt']

  @UpdatedAt
  @Column(DataType.DATE)
  declare updatedAt: StudyrightExtent['updatedAt']
}
