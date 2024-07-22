/* eslint-disable import/no-cycle */
import { InferAttributes } from 'sequelize'
import { AutoIncrement, BelongsTo, Column, DataType, ForeignKey, Model, PrimaryKey, Table } from 'sequelize-typescript'

import { TagStudent } from './tagStudent'

@Table({
  modelName: 'tag',
  tableName: 'tag',
})
export class Tag extends Model<InferAttributes<Tag>> {
  @PrimaryKey
  @AutoIncrement
  @ForeignKey(() => TagStudent)
  @Column(DataType.BIGINT)
  tag_id!: bigint

  @BelongsTo(() => TagStudent)
  tagStudent!: TagStudent

  @Column(DataType.STRING)
  tagname!: string

  @Column(DataType.STRING)
  studytrack!: string

  @Column(DataType.STRING)
  year!: string

  @Column(DataType.BIGINT)
  personal_user_id!: bigint
}
