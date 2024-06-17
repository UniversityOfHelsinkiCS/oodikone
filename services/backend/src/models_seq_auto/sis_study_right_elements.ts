import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { organization, organizationId } from './organization';
import type { sis_study_rights, sis_study_rightsId } from './sis_study_rights';

export interface sis_study_right_elementsAttributes {
  id: string;
  start_date?: Date;
  end_date?: Date;
  graduated?: boolean;
  phase?: number;
  study_right_id?: string;
  code?: string;
  name?: object;
  study_tracks?: object;
  faculty_code?: string;
  created_at?: Date;
  updated_at?: Date;
}

export type sis_study_right_elementsPk = "id";
export type sis_study_right_elementsId = sis_study_right_elements[sis_study_right_elementsPk];
export type sis_study_right_elementsOptionalAttributes = "start_date" | "end_date" | "graduated" | "phase" | "study_right_id" | "code" | "name" | "study_tracks" | "faculty_code" | "created_at" | "updated_at";
export type sis_study_right_elementsCreationAttributes = Optional<sis_study_right_elementsAttributes, sis_study_right_elementsOptionalAttributes>;

export class sis_study_right_elements extends Model<sis_study_right_elementsAttributes, sis_study_right_elementsCreationAttributes> implements sis_study_right_elementsAttributes {
  declare id: string;
  declare start_date?: Date;
  declare end_date?: Date;
  declare graduated?: boolean;
  declare phase?: number;
  declare study_right_id?: string;
  declare code?: string;
  declare name?: object;
  declare study_tracks?: object;
  declare faculty_code?: string;
  declare created_at?: Date;
  declare updated_at?: Date;

  // sis_study_right_elements belongsTo organization via faculty_code
  declare faculty_code_organization: organization;
  declare getFaculty_code_organization: Sequelize.BelongsToGetAssociationMixin<organization>;
  declare setFaculty_code_organization: Sequelize.BelongsToSetAssociationMixin<organization, organizationId>;
  declare createFaculty_code_organization: Sequelize.BelongsToCreateAssociationMixin<organization>;
  // sis_study_right_elements belongsTo sis_study_rights via study_right_id
  declare study_right: sis_study_rights;
  declare getStudy_right: Sequelize.BelongsToGetAssociationMixin<sis_study_rights>;
  declare setStudy_right: Sequelize.BelongsToSetAssociationMixin<sis_study_rights, sis_study_rightsId>;
  declare createStudy_right: Sequelize.BelongsToCreateAssociationMixin<sis_study_rights>;

  static initModel(sequelize: Sequelize.Sequelize): typeof sis_study_right_elements {
    return sis_study_right_elements.init({
    id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      primaryKey: true
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    graduated: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    phase: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    study_right_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      references: {
        model: 'sis_study_rights',
        key: 'id'
      }
    },
    code: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    name: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    study_tracks: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    faculty_code: {
      type: DataTypes.STRING(255),
      allowNull: true,
      references: {
        model: 'organization',
        key: 'code'
      }
    }
  }, {
    sequelize,
    tableName: 'sis_study_right_elements',
    schema: 'public',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        name: "sis_study_right_elements_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
  }
}
