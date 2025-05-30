import { Column, CreatedAt, DataType, Model, Table, UpdatedAt } from 'sequelize-typescript'

import type { CurriculumPeriod } from '@oodikone/shared/models'
import type { Name } from '@oodikone/shared/types'

@Table({
  underscored: true,
  modelName: 'curriculum_period',
  tableName: 'curriculum_periods',
})
export class CurriculumPeriodModel extends Model<CurriculumPeriod> implements CurriculumPeriod {
  @Column({ type: DataType.STRING, primaryKey: true })
  id!: string

  @Column({ type: DataType.JSONB, allowNull: false })
  name!: Name

  @Column({ type: DataType.STRING, allowNull: false })
  universityOrgId!: string

  @Column({ type: DataType.DATE, allowNull: false })
  startDate!: Date

  @Column({ type: DataType.DATE, allowNull: false })
  endDate!: Date

  @CreatedAt
  @Column({ type: DataType.DATE, allowNull: false })
  createdAt!: Date

  @UpdatedAt
  @Column({ type: DataType.DATE, allowNull: false })
  updatedAt!: Date
}
