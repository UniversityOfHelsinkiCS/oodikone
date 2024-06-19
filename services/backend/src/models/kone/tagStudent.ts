import { Model, Table, Column, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript'
import { Tag } from './tag'
import { Student } from '../student'

@Table({
  modelName: 'tag_student',
  tableName: 'tag_student',
})
export class TagStudent extends Model {
  @ForeignKey(() => Tag)
  @Column(DataType.BIGINT)
  tag_id: bigint

  @ForeignKey(() => Student)
  @Column(DataType.STRING)
  studentnumber: string

  @BelongsTo(() => Tag)
  tag: Tag
}
