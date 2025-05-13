import { Column, CreatedAt, DataType, ForeignKey, Model, Table, UpdatedAt } from 'sequelize-typescript'

import type { CreditTeacher } from '@oodikone/shared/models'

import { CreditModel } from './credit'
import { TeacherModel } from './teacher'

@Table({
  underscored: false,
  modelName: 'credit_teacher',
  tableName: 'credit_teachers',
})
export class CreditTeacherModel extends Model<CreditTeacher> implements CreditTeacher {
  @ForeignKey(() => CreditModel)
  @Column(DataType.STRING)
  credit_id!: string

  @ForeignKey(() => TeacherModel)
  @Column(DataType.STRING)
  teacher_id!: string

  @CreatedAt
  @Column(DataType.DATE)
  createdAt!: Date

  @UpdatedAt
  @Column(DataType.DATE)
  updatedAt!: Date
}
