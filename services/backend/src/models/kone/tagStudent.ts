import { AutoIncrement, BelongsTo, Column, DataType, ForeignKey, Model, PrimaryKey, Table } from 'sequelize-typescript'

import type { TagStudent } from '@oodikone/shared/models/kone'

import { StudentModel } from '../student'
import { TagModel } from './tag'

@Table({
  modelName: 'tag_student',
  tableName: 'tag_student',
})
export class TagStudentModel extends Model implements TagStudent {
  @PrimaryKey
  @AutoIncrement
  @ForeignKey(() => TagModel)
  @Column(DataType.BIGINT)
  declare tag_id: TagStudent['tag_id']

  @PrimaryKey
  @ForeignKey(() => StudentModel)
  @Column(DataType.STRING)
  declare studentnumber: TagStudent['studentnumber']

  @BelongsTo(() => TagModel)
  declare tag: TagStudent['tag']
}
