import { Model, Table, Column, PrimaryKey, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript'
import { TagStudent } from './tagStudent'

@Table({
  modelName: 'tag',
  tableName: 'tag',
})
export class Tag extends Model {
  @PrimaryKey
  @Column(DataType.BIGINT)
  tag_id: bigint

  @BelongsTo(() => TagStudent)
  tagStudent: TagStudent

  @ForeignKey(() => TagStudent)
  @Column(DataType.STRING)
  tagname: string

  @Column(DataType.STRING)
  studytrack: string

  @Column(DataType.STRING)
  year: string

  @Column(DataType.BIGINT)
  personal_user_id: bigint
}