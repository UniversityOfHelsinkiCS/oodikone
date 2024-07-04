import { Column, DataType, ForeignKey, Model, PrimaryKey, Table } from 'sequelize-typescript'

import { Credit } from './credit'
import { Teacher } from './teacher'

@Table({
  underscored: false,
  modelName: 'credit_teacher',
  tableName: 'credit_teachers',
})
export class CreditTeacher extends Model {
  @PrimaryKey
  @Column(DataType.STRING)
  composite!: string

  @ForeignKey(() => Credit)
  @Column(DataType.STRING)
  credit_id: string

  @ForeignKey(() => Teacher)
  @Column(DataType.STRING)
  teacher_id: string

  @Column(DataType.DATE)
  createdAt: Date

  @Column(DataType.DATE)
  updatedAt: Date
}
