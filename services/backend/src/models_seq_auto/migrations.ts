import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';

export interface migrationsAttributes {
  name: string;
}

export type migrationsPk = "name";
export type migrationsId = migrations[migrationsPk];
export type migrationsCreationAttributes = migrationsAttributes;

export class migrations extends Model<migrationsAttributes, migrationsCreationAttributes> implements migrationsAttributes {
  declare name: string;


  static initModel(sequelize: Sequelize.Sequelize): typeof migrations {
    return migrations.init({
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      primaryKey: true
    }
  }, {
    sequelize,
    tableName: 'migrations',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "migrations_pkey",
        unique: true,
        fields: [
          { name: "name" },
        ]
      },
    ]
  });
  }
}
