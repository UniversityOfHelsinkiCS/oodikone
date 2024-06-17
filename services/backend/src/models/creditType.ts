const { Model } = require('sequelize-typescript')

import { Table, Column, DataType, PrimaryKey, CreatedAt, UpdatedAt } from 'sequelize-typescript'

@Table({
  underscored: true,
  modelName: 'credit_type',
  tableName: 'credit_types',
})

export class CreditType extends Model {
  @PrimaryKey
  @Column(DataType.INTEGER)
  credittypecode!: number;

  @Column(DataType.JSONB)
  name!: object

  @CreatedAt
  @Column(DataType.DATE)
  createdAt!: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  updatedAt!: Date;

}

// CreditType.init(
//   {
//     credittypecode: {
//       primaryKey: true,
//       type: INTEGER,
//     },
//     name: {
//       type: JSONB,
//     },
//     createdAt: {
//       type: DATE,
//     },
//     updatedAt: {
//       type: DATE,
//     },
//   },
//   {
//     underscored: true,
//     sequelize: dbConnections.sequelize,
//     modelName: 'credit_type',
//     tableName: 'credit_types',
//   }
// )
