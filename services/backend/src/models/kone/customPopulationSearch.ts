import { CreationOptional } from 'sequelize'
import { AutoIncrement, Column, DataType, Model, PrimaryKey, Table } from 'sequelize-typescript'

import type { CustomPopulationSearch, CustomPopulationSearchCreation } from '@oodikone/shared/models/kone'

@Table({
  underscored: false,
  modelName: 'custom_population_search',
  tableName: 'custom_population_searches',
})
export class CustomPopulationSearchModel
  extends Model<CustomPopulationSearch, CustomPopulationSearchCreation>
  implements CustomPopulationSearch
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
  students!: string[]
}
