import { CreationOptional } from 'sequelize'
import { AutoIncrement, Column, DataType, Default, Model, PrimaryKey, Table, Unique } from 'sequelize-typescript'

import type { Language } from '@oodikone/shared/language'
import type { User, UserCreation } from '@oodikone/shared/models/user'

import type { Role } from '@oodikone/shared/types'

@Table({
  underscored: true,
  timestamps: false,
  modelName: 'users',
  tableName: 'users',
})
export class UserModel extends Model<User, UserCreation> implements User {
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
