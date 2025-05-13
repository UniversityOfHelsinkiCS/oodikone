import { CreationOptional } from 'sequelize'
import { AutoIncrement, BelongsTo, Column, DataType, ForeignKey, Model, PrimaryKey, Table } from 'sequelize-typescript'

import type { Tag, TagStudent, TagStudentCreation } from '@oodikone/shared/models/kone'

import { StudentModel } from '../student'
import { TagModel } from './tag'

@Table({
  modelName: 'tag_student',
  tableName: 'tag_student',
})
export class TagStudentModel extends Model<TagStudent, TagStudentCreation> implements TagStudent {
  @PrimaryKey
  @AutoIncrement
  @ForeignKey(() => TagModel)
  @Column(DataType.BIGINT)
  tag_id!: string

  @PrimaryKey
  @ForeignKey(() => StudentModel)
  @Column(DataType.STRING)
  studentnumber!: string

  @BelongsTo(() => TagModel)
  tag!: CreationOptional<Tag>
}
