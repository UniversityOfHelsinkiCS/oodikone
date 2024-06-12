import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { credit, creditId } from './credit';

export interface credit_typesAttributes {
  credittypecode: number;
  name?: object;
  created_at?: Date;
  updated_at?: Date;
}

export type credit_typesPk = "credittypecode";
export type credit_typesId = credit_types[credit_typesPk];
export type credit_typesOptionalAttributes = "name" | "created_at" | "updated_at";
export type credit_typesCreationAttributes = Optional<credit_typesAttributes, credit_typesOptionalAttributes>;

export class credit_types extends Model<credit_typesAttributes, credit_typesCreationAttributes> implements credit_typesAttributes {
  declare credittypecode: number;
  declare name?: object;
  declare created_at?: Date;
  declare updated_at?: Date;

  // credit_types hasMany credit via credittypecode
  declare credits: credit[];
  declare getCredits: Sequelize.HasManyGetAssociationsMixin<credit>;
  declare setCredits: Sequelize.HasManySetAssociationsMixin<credit, creditId>;
  declare addCredit: Sequelize.HasManyAddAssociationMixin<credit, creditId>;
  declare addCredits: Sequelize.HasManyAddAssociationsMixin<credit, creditId>;
  declare createCredit: Sequelize.HasManyCreateAssociationMixin<credit>;
  declare removeCredit: Sequelize.HasManyRemoveAssociationMixin<credit, creditId>;
  declare removeCredits: Sequelize.HasManyRemoveAssociationsMixin<credit, creditId>;
  declare hasCredit: Sequelize.HasManyHasAssociationMixin<credit, creditId>;
  declare hasCredits: Sequelize.HasManyHasAssociationsMixin<credit, creditId>;
  declare countCredits: Sequelize.HasManyCountAssociationsMixin;

  static initModel(sequelize: Sequelize.Sequelize): typeof credit_types {
    return credit_types.init({
    credittypecode: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    name: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'credit_types',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "credit_types_pkey",
        unique: true,
        fields: [
          { name: "credittypecode" },
        ]
      },
    ]
  });
  }
}
