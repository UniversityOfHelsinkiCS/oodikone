import { AutoIncrement, BelongsTo, Column, DataType, ForeignKey, Model, PrimaryKey, Table } from 'sequelize-typescript'

import type { Tag } from '@oodikone/shared/models/kone'

import { TagStudentModel } from './tagStudent'

@Table({
  modelName: 'tag',
  tableName: 'tag',
})
export class TagModel extends Model implements Tag {
  @PrimaryKey
  @AutoIncrement
  @ForeignKey(() => TagStudentModel)
  @Column(DataType.BIGINT)
  declare tag_id: Tag['tag_id']

  @BelongsTo(() => TagStudentModel)
  declare tagStudent: Tag['tagStudent']

  @Column(DataType.STRING)
  declare tagname: Tag['tagname']

  @Column(DataType.STRING)
  declare studytrack: Tag['studytrack']

  @Column(DataType.STRING)
  declare year: Tag['year']

  @Column(DataType.BIGINT)
  declare personal_user_id: Tag['personal_user_id']
}
