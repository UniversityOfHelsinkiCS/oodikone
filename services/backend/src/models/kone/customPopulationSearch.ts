import { AutoIncrement, Column, DataType, Model, PrimaryKey, Table } from 'sequelize-typescript'

import type { CustomPopulationSearch } from '@oodikone/shared/models/kone'

@Table({
  underscored: false,
  modelName: 'custom_population_search',
  tableName: 'custom_population_searches',
})
export class CustomPopulationSearchModel extends Model implements CustomPopulationSearch {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  declare id: CustomPopulationSearch['id']

  @Column(DataType.BIGINT)
  declare userId: CustomPopulationSearch['userId']

  @Column(DataType.STRING)
  declare name: CustomPopulationSearch['name']

  @Column(DataType.ARRAY(DataType.STRING))
  declare students: CustomPopulationSearch['students']
}
