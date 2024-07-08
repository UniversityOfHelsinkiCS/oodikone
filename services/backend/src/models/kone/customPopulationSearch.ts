import { Column, DataType, Model, PrimaryKey, Table } from 'sequelize-typescript'

@Table({
  underscored: false,
  modelName: 'custom_population_search',
  tableName: 'custom_population_searches',
})
export class CustomPopulationSearch extends Model {
  @PrimaryKey
  @Column(DataType.BIGINT)
  id: bigint

  @Column(DataType.BIGINT)
  userId: bigint

  @Column(DataType.STRING)
  name: string

  @Column(DataType.ARRAY(DataType.STRING))
  students: string[]
}
