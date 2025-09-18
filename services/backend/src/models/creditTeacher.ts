import { Column, CreatedAt, DataType, ForeignKey, Model, Table, UpdatedAt } from 'sequelize-typescript'

import type { CreditTeacher } from '@oodikone/shared/models'

import { CreditModel } from './credit'
import { TeacherModel } from './teacher'

@Table({
  underscored: false,
  modelName: 'credit_teacher',
  tableName: 'credit_teachers',
})
export class CreditTeacherModel extends Model implements CreditTeacher {
  @ForeignKey(() => CreditModel)
  @Column(DataType.STRING)
  declare credit_id: CreditTeacher['credit_id']

  @ForeignKey(() => TeacherModel)
  @Column(DataType.STRING)
  declare teacher_id: CreditTeacher['teacher_id']

  @CreatedAt
  @Column(DataType.DATE)
  declare createdAt: CreditTeacher['createdAt']

  @UpdatedAt
  @Column(DataType.DATE)
  declare updatedAt: CreditTeacher['updatedAt']
}
