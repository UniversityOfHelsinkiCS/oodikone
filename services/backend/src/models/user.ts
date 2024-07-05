import { AllowNull, Column, DataType, Default, Model, PrimaryKey, Table, Unique } from 'sequelize-typescript'

@Table({
  underscored: true,
  timestamps: false,
  modelName: 'users',
  tableName: 'users',
})
export class User extends Model {
  @PrimaryKey
  @Column(DataType.BIGINT)
  id!: bigint

  @Column(DataType.STRING)
  fullName: string

  @Unique
  @Column(DataType.STRING)
  username: string

  @Column(DataType.STRING)
  email: string

  @Column(DataType.STRING)
  language: string

  @Column(DataType.STRING)
  sisuPersonId: string

  @Column(DataType.DATE)
  lastLogin: Date

  @AllowNull(false)
  @Default([])
  @Column(DataType.ARRAY(DataType.STRING))
  roles: string[]

  @AllowNull(false)
  @Default([])
  @Column(DataType.ARRAY(DataType.STRING))
  programmeRights: string[]
}
