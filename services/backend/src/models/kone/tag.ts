import { CreationOptional } from 'sequelize'
import { AutoIncrement, BelongsTo, Column, DataType, ForeignKey, Model, PrimaryKey, Table } from 'sequelize-typescript'

import type { Tag, TagCreation, TagStudent } from '@oodikone/shared/models/kone'

import { TagStudentModel } from './tagStudent'

@Table({
  modelName: 'tag',
  tableName: 'tag',
})
export class TagModel extends Model<Tag, TagCreation> implements Tag {
  @PrimaryKey
  @AutoIncrement
  @ForeignKey(() => TagStudentModel)
  @Column(DataType.BIGINT)
  tag_id!: CreationOptional<string>

  @BelongsTo(() => TagStudentModel)
  tagStudent!: CreationOptional<TagStudent>

  @Column(DataType.STRING)
  tagname!: string

  @Column(DataType.STRING)
  studytrack!: string

  @Column(DataType.STRING)
  year!: string | null

  @Column(DataType.BIGINT)
  personal_user_id!: string | null
}
