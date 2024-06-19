import { Model, Table, Column, DataType, ForeignKey, BelongsTo, PrimaryKey } from 'sequelize-typescript'
import { Tag } from './tag'
import { Student } from '../student'

@Table({
  modelName: 'tag_student',
  tableName: 'tag_student',
})
export class TagStudent extends Model {

  @PrimaryKey
  @ForeignKey(() => Tag)
  @Column(DataType.BIGINT)
  tag_id: bigint

  @PrimaryKey
  @ForeignKey(() => Student)
  @Column(DataType.STRING)
  studentnumber: string

  @BelongsTo(() => Tag)
  tag: Tag
}
