import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { sis_study_rights, sis_study_rightsId } from './sis_study_rights';
import type { studyright, studyrightId } from './studyright';

export interface studyright_extentsAttributes {
  extentcode: number;
  name?: object;
  createdAt?: Date;
  updatedAt?: Date;
}

export type studyright_extentsPk = "extentcode";
export type studyright_extentsId = studyright_extents[studyright_extentsPk];
export type studyright_extentsOptionalAttributes = "name" | "createdAt" | "updatedAt";
export type studyright_extentsCreationAttributes = Optional<studyright_extentsAttributes, studyright_extentsOptionalAttributes>;

export class studyright_extents extends Model<studyright_extentsAttributes, studyright_extentsCreationAttributes> implements studyright_extentsAttributes {
  declare extentcode: number;
  declare name?: object;
  declare createdAt?: Date;
  declare updatedAt?: Date;

  // studyright_extents hasMany sis_study_rights via extent_code
  declare sis_study_rights: sis_study_rights[];
  declare getSis_study_rights: Sequelize.HasManyGetAssociationsMixin<sis_study_rights>;
  declare setSis_study_rights: Sequelize.HasManySetAssociationsMixin<sis_study_rights, sis_study_rightsId>;
  declare addSis_study_right: Sequelize.HasManyAddAssociationMixin<sis_study_rights, sis_study_rightsId>;
  declare addSis_study_rights: Sequelize.HasManyAddAssociationsMixin<sis_study_rights, sis_study_rightsId>;
  declare createSis_study_right: Sequelize.HasManyCreateAssociationMixin<sis_study_rights>;
  declare removeSis_study_right: Sequelize.HasManyRemoveAssociationMixin<sis_study_rights, sis_study_rightsId>;
  declare removeSis_study_rights: Sequelize.HasManyRemoveAssociationsMixin<sis_study_rights, sis_study_rightsId>;
  declare hasSis_study_right: Sequelize.HasManyHasAssociationMixin<sis_study_rights, sis_study_rightsId>;
  declare hasSis_study_rights: Sequelize.HasManyHasAssociationsMixin<sis_study_rights, sis_study_rightsId>;
  declare countSis_study_rights: Sequelize.HasManyCountAssociationsMixin;
  // studyright_extents hasMany studyright via extentcode
  declare studyrights: studyright[];
  declare getStudyrights: Sequelize.HasManyGetAssociationsMixin<studyright>;
  declare setStudyrights: Sequelize.HasManySetAssociationsMixin<studyright, studyrightId>;
  declare addStudyright: Sequelize.HasManyAddAssociationMixin<studyright, studyrightId>;
  declare addStudyrights: Sequelize.HasManyAddAssociationsMixin<studyright, studyrightId>;
  declare createStudyright: Sequelize.HasManyCreateAssociationMixin<studyright>;
  declare removeStudyright: Sequelize.HasManyRemoveAssociationMixin<studyright, studyrightId>;
  declare removeStudyrights: Sequelize.HasManyRemoveAssociationsMixin<studyright, studyrightId>;
  declare hasStudyright: Sequelize.HasManyHasAssociationMixin<studyright, studyrightId>;
  declare hasStudyrights: Sequelize.HasManyHasAssociationsMixin<studyright, studyrightId>;
  declare countStudyrights: Sequelize.HasManyCountAssociationsMixin;

  static initModel(sequelize: Sequelize.Sequelize): typeof studyright_extents {
    return studyright_extents.init({
    extentcode: {
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
    tableName: 'studyright_extents',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "studyright_extents_pkey",
        unique: true,
        fields: [
          { name: "extentcode" },
        ]
      },
    ]
  });
  }
}
