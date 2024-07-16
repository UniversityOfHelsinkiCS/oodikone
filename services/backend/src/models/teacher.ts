/* eslint-disable import/no-cycle */
import { BelongsToMany, Column, CreatedAt, DataType, Model, PrimaryKey, Table, UpdatedAt } from 'sequelize-typescript'

import { Credit } from './credit'
import { CreditTeacher } from './creditTeacher'

@Table({
  underscored: true,
  modelName: 'teacher',
  tableName: 'teacher',
})
export class Teacher extends Model {
  @PrimaryKey
  @Column(DataType.STRING)
  id: string

  @Column(DataType.STRING)
  name: string

  @BelongsToMany(() => Credit, () => CreditTeacher)
  credits: Credit[]

  @CreatedAt
  @Column(DataType.DATE)
  createdAt: Date

  @UpdatedAt
  @Column(DataType.DATE)
  updatedAt: Date
}
