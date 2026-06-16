import { AutoIncrement, Column, DataType, Model, PrimaryKey, Table } from 'sequelize-typescript'

import type { CompletedCoursesSearch } from '@oodikone/shared/models/kone'

@Table({
  underscored: true,
  timestamps: true,
  modelName: 'completed_courses_search',
  tableName: 'completed_courses_searches',
})
export class CompletedCoursesSearchModel extends Model implements CompletedCoursesSearch {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  declare id: CompletedCoursesSearch['id']

  @Column(DataType.BIGINT)
  declare userId: CompletedCoursesSearch['userId']

  @Column(DataType.STRING)
  declare name: CompletedCoursesSearch['name']

  @Column(DataType.ARRAY(DataType.STRING))
  declare courseCodes: CompletedCoursesSearch['courseCodes']
}
