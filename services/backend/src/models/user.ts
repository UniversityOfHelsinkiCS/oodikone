import { CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize'
import { AutoIncrement, Column, DataType, Default, Model, PrimaryKey, Table, Unique } from 'sequelize-typescript'

import { Language, Role } from '../shared/types'

@Table({
  underscored: true,
  timestamps: false,
  modelName: 'users',
  tableName: 'users',
})
export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  id!: CreationOptional<string>

  @Column(DataType.STRING)
  fullName!: string

  @Unique
  @Column(DataType.STRING)
  username!: string

  @Column(DataType.STRING)
  email!: string

  @Default('fi')
  @Column(DataType.STRING)
  language!: CreationOptional<Language>

  @Column(DataType.STRING)
  sisuPersonId!: string

  @Column(DataType.DATE)
  lastLogin!: Date

  @Default([])
  @Column(DataType.ARRAY(DataType.STRING))
  roles!: CreationOptional<Role[]>

  @Default([])
  @Column(DataType.ARRAY(DataType.STRING))
  programmeRights!: CreationOptional<string[]>
}
