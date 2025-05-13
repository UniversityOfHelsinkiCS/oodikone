import { CreationOptional } from 'sequelize'
import { AutoIncrement, Column, DataType, Model, PrimaryKey, Table } from 'sequelize-typescript'

import type { OpenUniPopulationSearch, OpenUniPopulationSearchCreation } from '@oodikone/shared/models/kone'

@Table({
  underscored: true,
  timestamps: true,
  modelName: 'open_uni_population_search',
  tableName: 'open_uni_population_searches',
})
export class OpenUniPopulationSearchModel
  extends Model<OpenUniPopulationSearch, OpenUniPopulationSearchCreation>
  implements OpenUniPopulationSearch
{
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  id!: CreationOptional<string>

  @Column(DataType.BIGINT)
  userId!: string

  @Column(DataType.STRING)
  name!: string

  @Column(DataType.ARRAY(DataType.STRING))
  courseCodes!: string[]
}
