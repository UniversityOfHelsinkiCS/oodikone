import { CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize'
import { AutoIncrement, Column, DataType, Model, PrimaryKey, Table } from 'sequelize-typescript'

@Table({
  underscored: false,
  modelName: 'custom_population_search',
  tableName: 'custom_population_searches',
})
export class CustomPopulationSearch extends Model<
  InferAttributes<CustomPopulationSearch>,
  InferCreationAttributes<CustomPopulationSearch>
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
  students!: string[]
}
