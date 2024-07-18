import { AutoIncrement, Column, DataType, Default, Model, PrimaryKey, Table, Unique } from 'sequelize-typescript'

import { Language, Role } from '../types'

@Table({
  underscored: true,
  timestamps: false,
  modelName: 'users',
  tableName: 'users',
})
export class User extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  id: bigint

  @Column(DataType.STRING)
  fullName: string

  @Unique
  @Column(DataType.STRING)
  username: string

  @Column(DataType.STRING)
  email: string

  @Default('fi')
  @Column(DataType.STRING)
  language: Language

  @Column(DataType.STRING)
  sisuPersonId: string

  @Column(DataType.DATE)
  lastLogin: Date

  @Default([])
  @Column(DataType.ARRAY(DataType.STRING))
  roles: Role[]

  @Default([])
  @Column(DataType.ARRAY(DataType.STRING))
  programmeRights: string[]
}
