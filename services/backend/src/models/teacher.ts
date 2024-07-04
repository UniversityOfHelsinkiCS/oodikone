import { BelongsToMany, Column, DataType, Model, PrimaryKey, Table } from 'sequelize-typescript'

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
  id!: string

  @BelongsToMany(() => Credit, () => CreditTeacher)
  credits: Credit[]

  @Column(DataType.STRING)
  name: string

  @Column(DataType.DATE)
  createdAt: Date

  @Column(DataType.DATE)
  updatedAt: Date
}
