import { Column, CreatedAt, DataType, Model, Table, UpdatedAt } from 'sequelize-typescript'

import type { CurriculumPeriod } from '@oodikone/shared/models'

@Table({
  underscored: true,
  modelName: 'curriculum_period',
  tableName: 'curriculum_periods',
})
export class CurriculumPeriodModel extends Model implements CurriculumPeriod {
  @Column({ type: DataType.STRING, primaryKey: true })
  declare id: CurriculumPeriod['id']

  @Column({ type: DataType.JSONB, allowNull: false })
  declare name: CurriculumPeriod['name']

  @Column({ type: DataType.STRING, allowNull: false })
  declare universityOrgId: CurriculumPeriod['universityOrgId']

  @Column({ type: DataType.DATE, allowNull: false })
  declare startDate: CurriculumPeriod['startDate']

  @Column({ type: DataType.DATE, allowNull: false })
  declare endDate: CurriculumPeriod['endDate']

  @CreatedAt
  @Column({ type: DataType.DATE, allowNull: false })
  declare createdAt: CurriculumPeriod['createdAt']

  @UpdatedAt
  @Column({ type: DataType.DATE, allowNull: false })
  declare updatedAt: CurriculumPeriod['updatedAt']
}
