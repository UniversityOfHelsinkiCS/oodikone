import { AutoIncrement, Column, DataType, Model, PrimaryKey, Table } from 'sequelize-typescript'

import type { OpenUniPopulationSearch } from '@oodikone/shared/models/kone'

@Table({
  underscored: true,
  timestamps: true,
  modelName: 'open_uni_population_search',
  tableName: 'open_uni_population_searches',
})
export class OpenUniPopulationSearchModel extends Model implements OpenUniPopulationSearch {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  declare id: OpenUniPopulationSearch['id']

  @Column(DataType.BIGINT)
  declare userId: OpenUniPopulationSearch['userId']

  @Column(DataType.STRING)
  declare name: OpenUniPopulationSearch['name']

  @Column(DataType.ARRAY(DataType.STRING))
  declare courseCodes: OpenUniPopulationSearch['courseCodes']
}
