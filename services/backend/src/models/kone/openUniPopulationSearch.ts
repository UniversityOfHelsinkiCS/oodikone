import { Column, DataType, Model, PrimaryKey, Table } from 'sequelize-typescript'

@Table({
  underscored: true,
  timestamps: true,
  modelName: 'open_uni_population_search',
  tableName: 'open_uni_population_searches',
})
export class OpenUniPopulationSearch extends Model {
  @PrimaryKey
  @Column(DataType.BIGINT)
  id: bigint

  @Column(DataType.BIGINT)
  userId: bigint

  @Column(DataType.STRING)
  name: string

  @Column(DataType.ARRAY(DataType.STRING))
  courseCodes: string[]
}
