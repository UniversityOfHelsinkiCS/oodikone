import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { organization, organizationId } from './organization';
import type { programme_module_children, programme_module_childrenId } from './programme_module_children';

export interface programme_modulesAttributes {
  id: string;
  code?: string;
  name?: object;
  type?: string;
  created_at?: Date;
  updated_at?: Date;
  order?: number;
  study_level?: string;
  organization_id?: string;
  valid_from?: Date;
  valid_to?: Date;
  group_id?: string;
  curriculum_period_ids?: string[];
}

export type programme_modulesPk = "id";
export type programme_modulesId = programme_modules[programme_modulesPk];
export type programme_modulesOptionalAttributes = "code" | "name" | "type" | "created_at" | "updated_at" | "order" | "study_level" | "organization_id" | "valid_from" | "valid_to" | "group_id" | "curriculum_period_ids";
export type programme_modulesCreationAttributes = Optional<programme_modulesAttributes, programme_modulesOptionalAttributes>;

export class programme_modules extends Model<programme_modulesAttributes, programme_modulesCreationAttributes> implements programme_modulesAttributes {
  declare id: string;
  declare code?: string;
  declare name?: object;
  declare type?: string;
  declare created_at?: Date;
  declare updated_at?: Date;
  declare order?: number;
  declare study_level?: string;
  declare organization_id?: string;
  declare valid_from?: Date;
  declare valid_to?: Date;
  declare group_id?: string;
  declare curriculum_period_ids?: string[];

  // programme_modules belongsTo organization via organization_id
  declare organization: organization;
  declare getOrganization: Sequelize.BelongsToGetAssociationMixin<organization>;
  declare setOrganization: Sequelize.BelongsToSetAssociationMixin<organization, organizationId>;
  declare createOrganization: Sequelize.BelongsToCreateAssociationMixin<organization>;
  // programme_modules hasMany programme_module_children via parent_id
  declare programme_module_children: programme_module_children[];
  declare getProgramme_module_children: Sequelize.HasManyGetAssociationsMixin<programme_module_children>;
  declare setProgramme_module_children: Sequelize.HasManySetAssociationsMixin<programme_module_children, programme_module_childrenId>;
  declare addProgramme_module_child: Sequelize.HasManyAddAssociationMixin<programme_module_children, programme_module_childrenId>;
  declare addProgramme_module_children: Sequelize.HasManyAddAssociationsMixin<programme_module_children, programme_module_childrenId>;
  declare createProgramme_module_child: Sequelize.HasManyCreateAssociationMixin<programme_module_children>;
  declare removeProgramme_module_child: Sequelize.HasManyRemoveAssociationMixin<programme_module_children, programme_module_childrenId>;
  declare removeProgramme_module_children: Sequelize.HasManyRemoveAssociationsMixin<programme_module_children, programme_module_childrenId>;
  declare hasProgramme_module_child: Sequelize.HasManyHasAssociationMixin<programme_module_children, programme_module_childrenId>;
  declare hasProgramme_module_children: Sequelize.HasManyHasAssociationsMixin<programme_module_children, programme_module_childrenId>;
  declare countProgramme_module_children: Sequelize.HasManyCountAssociationsMixin;

  static initModel(sequelize: Sequelize.Sequelize): typeof programme_modules {
    return programme_modules.init({
    id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      primaryKey: true
    },
    code: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    name: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    type: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    study_level: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    organization_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      references: {
        model: 'organization',
        key: 'id'
      }
    },
    valid_from: {
      type: DataTypes.DATE,
      allowNull: true
    },
    valid_to: {
      type: DataTypes.DATE,
      allowNull: true
    },
    group_id: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    curriculum_period_ids: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'programme_modules',
    schema: 'public',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        name: "programme_modules_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
  }
}
