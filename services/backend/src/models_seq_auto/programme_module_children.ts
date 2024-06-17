import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { programme_modules, programme_modulesId } from './programme_modules';

export interface programme_module_childrenAttributes {
  composite: string;
  parent_id?: string;
  child_id?: string;
  created_at?: Date;
  updated_at?: Date;
}

export type programme_module_childrenPk = "composite";
export type programme_module_childrenId = programme_module_children[programme_module_childrenPk];
export type programme_module_childrenOptionalAttributes = "parent_id" | "child_id" | "created_at" | "updated_at";
export type programme_module_childrenCreationAttributes = Optional<programme_module_childrenAttributes, programme_module_childrenOptionalAttributes>;

export class programme_module_children extends Model<programme_module_childrenAttributes, programme_module_childrenCreationAttributes> implements programme_module_childrenAttributes {
  declare composite: string;
  declare parent_id?: string;
  declare child_id?: string;
  declare created_at?: Date;
  declare updated_at?: Date;

  // programme_module_children belongsTo programme_modules via parent_id
  declare parent: programme_modules;
  declare getParent: Sequelize.BelongsToGetAssociationMixin<programme_modules>;
  declare setParent: Sequelize.BelongsToSetAssociationMixin<programme_modules, programme_modulesId>;
  declare createParent: Sequelize.BelongsToCreateAssociationMixin<programme_modules>;

  static initModel(sequelize: Sequelize.Sequelize): typeof programme_module_children {
    return programme_module_children.init({
    composite: {
      type: DataTypes.STRING(255),
      allowNull: false,
      primaryKey: true
    },
    parent_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      references: {
        model: 'programme_modules',
        key: 'id'
      }
    },
    child_id: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'programme_module_children',
    schema: 'public',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        name: "programme_module_children_pkey",
        unique: true,
        fields: [
          { name: "composite" },
        ]
      },
    ]
  });
  }
}
