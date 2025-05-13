import { BelongsToMany, Column, CreatedAt, DataType, Model, PrimaryKey, Table, UpdatedAt } from 'sequelize-typescript'

import type { Teacher, Credit } from '@oodikone/shared/models'

import { CreditModel } from './credit'
import { CreditTeacherModel } from './creditTeacher'

@Table({
  underscored: true,
  modelName: 'teacher',
  tableName: 'teacher',
})
export class TeacherModel extends Model<Teacher> implements Teacher {
  @PrimaryKey
  @Column(DataType.STRING)
  id!: string

  @Column(DataType.STRING)
  name!: string

  @BelongsToMany(() => CreditModel, () => CreditTeacherModel)
  credits!: Credit[]

  @CreatedAt
  @Column(DataType.DATE)
  createdAt!: Date

  @UpdatedAt
  @Column(DataType.DATE)
  updatedAt!: Date
}
