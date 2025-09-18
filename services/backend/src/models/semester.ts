import { Column, CreatedAt, DataType, Model, PrimaryKey, Table, UpdatedAt } from 'sequelize-typescript'

import type { Semester } from '@oodikone/shared/models'

@Table({
  underscored: true,
  modelName: 'semester',
  tableName: 'semesters',
})
export class SemesterModel extends Model implements Semester {
  @PrimaryKey
  @Column(DataType.STRING)
  declare composite: Semester['composite']

  @Column(DataType.INTEGER)
  declare semestercode: Semester['semestercode']

  @Column(DataType.JSONB)
  declare name: Semester['name']

  @Column(DataType.INTEGER)
  declare startYear: Semester['startYear']

  @Column(DataType.DATE)
  declare startdate: Semester['startdate']

  @Column(DataType.DATE)
  declare enddate: Semester['enddate']

  @Column(DataType.INTEGER)
  declare yearcode: Semester['yearcode']

  @Column(DataType.STRING)
  declare yearname: Semester['yearname']

  @Column(DataType.STRING)
  declare org: Semester['org']

  @Column(DataType.INTEGER)
  declare termIndex: Semester['termIndex']

  @CreatedAt
  @Column(DataType.DATE)
  declare createdAt: Semester['createdAt']

  @UpdatedAt
  @Column(DataType.DATE)
  declare updatedAt: Semester['updatedAt']
}
