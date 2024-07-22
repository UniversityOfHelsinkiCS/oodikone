import { CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize'
import { AutoIncrement, Column, DataType, Model, PrimaryKey, Table } from 'sequelize-typescript'

@Table({
  underscored: true,
  timestamps: true,
  modelName: 'open_uni_population_search',
  tableName: 'open_uni_population_searches',
})
export class OpenUniPopulationSearch extends Model<
  InferAttributes<OpenUniPopulationSearch>,
  InferCreationAttributes<OpenUniPopulationSearch>
> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  id!: CreationOptional<bigint>

  @Column(DataType.BIGINT)
  userId!: bigint

  @Column(DataType.STRING)
  name!: string

  @Column(DataType.ARRAY(DataType.STRING))
  courseCodes!: string[]
}
