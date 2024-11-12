import { CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize'
import { AutoIncrement, BelongsTo, Column, DataType, ForeignKey, Model, PrimaryKey, Table } from 'sequelize-typescript'

import { TagStudent } from './tagStudent'

@Table({
  modelName: 'tag',
  tableName: 'tag',
})
export class Tag extends Model<InferAttributes<Tag>, InferCreationAttributes<Tag>> {
  @PrimaryKey
  @AutoIncrement
  @ForeignKey(() => TagStudent)
  @Column(DataType.BIGINT)
  tag_id!: CreationOptional<string>

  @BelongsTo(() => TagStudent)
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
