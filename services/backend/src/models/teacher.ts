import { BelongsToMany, Column, CreatedAt, DataType, Model, PrimaryKey, Table, UpdatedAt } from 'sequelize-typescript'

import type { Teacher } from '@oodikone/shared/models'

import { CreditModel } from './credit'
import { CreditTeacherModel } from './creditTeacher'

@Table({
  underscored: true,
  modelName: 'teacher',
  tableName: 'teacher',
})
export class TeacherModel extends Model implements Teacher {
  @PrimaryKey
  @Column(DataType.STRING)
  declare id: Teacher['id']

  @Column(DataType.STRING)
  declare name: Teacher['name']

  @BelongsToMany(() => CreditModel, () => CreditTeacherModel)
  declare credits: Teacher['credits']

  @CreatedAt
  @Column(DataType.DATE)
  declare createdAt: Teacher['createdAt']

  @UpdatedAt
  @Column(DataType.DATE)
  declare updatedAt: Teacher['updatedAt']
}
