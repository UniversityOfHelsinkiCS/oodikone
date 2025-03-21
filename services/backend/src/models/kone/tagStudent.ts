import { CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize'
import { AutoIncrement, BelongsTo, Column, DataType, ForeignKey, Model, PrimaryKey, Table } from 'sequelize-typescript'

import { Student } from '../student'
import { Tag } from './tag'

@Table({
  modelName: 'tag_student',
  tableName: 'tag_student',
})
export class TagStudent extends Model<InferAttributes<TagStudent>, InferCreationAttributes<TagStudent>> {
  @PrimaryKey
  @AutoIncrement
  @ForeignKey(() => Tag)
  @Column(DataType.BIGINT)
  tag_id!: string

  @PrimaryKey
  @ForeignKey(() => Student)
  @Column(DataType.STRING)
  studentnumber!: string

  @BelongsTo(() => Tag)
  tag!: CreationOptional<Tag>
}
