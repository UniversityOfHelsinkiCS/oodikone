import { AutoIncrement, Column, DataType, Default, Model, PrimaryKey, Table, Unique } from 'sequelize-typescript'

import type { User, UserCreation } from '@oodikone/shared/models/user'

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
  declare id: User['id']

  @Column(DataType.STRING)
  declare fullName: User['fullName']

  @Unique
  @Column(DataType.STRING)
  declare username: User['username']

  @Column(DataType.STRING)
  declare email: User['email']

  @Default('fi')
  @Column(DataType.STRING)
  declare language: User['language']

  @Column(DataType.STRING)
  declare sisuPersonId: User['sisuPersonId']

  @Column(DataType.DATE)
  declare lastLogin: User['lastLogin']

  @Default([])
  @Column(DataType.ARRAY(DataType.STRING))
  declare roles: User['roles']

  @Default([])
  @Column(DataType.ARRAY(DataType.STRING))
  declare programmeRights: User['programmeRights']
}
