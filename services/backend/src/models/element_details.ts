import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { studyright_elements, studyright_elementsId } from './studyright_elements';
import type { transfers, transfersId } from './transfers';

export interface element_detailsAttributes {
  code: string;
  name?: object;
  type?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type element_detailsPk = "code";
export type element_detailsId = element_details[element_detailsPk];
export type element_detailsOptionalAttributes = "name" | "type" | "createdAt" | "updatedAt";
export type element_detailsCreationAttributes = Optional<element_detailsAttributes, element_detailsOptionalAttributes>;

export class element_details extends Model<element_detailsAttributes, element_detailsCreationAttributes> implements element_detailsAttributes {
  declare code: string;
  declare name?: object;
  declare type?: number;
  declare createdAt?: Date;
  declare updatedAt?: Date;

  // element_details hasMany studyright_elements via code
  declare studyright_elements: studyright_elements[];
  declare getStudyright_elements: Sequelize.HasManyGetAssociationsMixin<studyright_elements>;
  declare setStudyright_elements: Sequelize.HasManySetAssociationsMixin<studyright_elements, studyright_elementsId>;
  declare addStudyright_element: Sequelize.HasManyAddAssociationMixin<studyright_elements, studyright_elementsId>;
  declare addStudyright_elements: Sequelize.HasManyAddAssociationsMixin<studyright_elements, studyright_elementsId>;
  declare createStudyright_element: Sequelize.HasManyCreateAssociationMixin<studyright_elements>;
  declare removeStudyright_element: Sequelize.HasManyRemoveAssociationMixin<studyright_elements, studyright_elementsId>;
  declare removeStudyright_elements: Sequelize.HasManyRemoveAssociationsMixin<studyright_elements, studyright_elementsId>;
  declare hasStudyright_element: Sequelize.HasManyHasAssociationMixin<studyright_elements, studyright_elementsId>;
  declare hasStudyright_elements: Sequelize.HasManyHasAssociationsMixin<studyright_elements, studyright_elementsId>;
  declare countStudyright_elements: Sequelize.HasManyCountAssociationsMixin;
  // element_details hasMany transfers via sourcecode
  declare transfers: transfers[];
  declare getTransfers: Sequelize.HasManyGetAssociationsMixin<transfers>;
  declare setTransfers: Sequelize.HasManySetAssociationsMixin<transfers, transfersId>;
  declare addTransfer: Sequelize.HasManyAddAssociationMixin<transfers, transfersId>;
  declare addTransfers: Sequelize.HasManyAddAssociationsMixin<transfers, transfersId>;
  declare createTransfer: Sequelize.HasManyCreateAssociationMixin<transfers>;
  declare removeTransfer: Sequelize.HasManyRemoveAssociationMixin<transfers, transfersId>;
  declare removeTransfers: Sequelize.HasManyRemoveAssociationsMixin<transfers, transfersId>;
  declare hasTransfer: Sequelize.HasManyHasAssociationMixin<transfers, transfersId>;
  declare hasTransfers: Sequelize.HasManyHasAssociationsMixin<transfers, transfersId>;
  declare countTransfers: Sequelize.HasManyCountAssociationsMixin;
  // element_details hasMany transfers via targetcode
  declare targetcode_transfers: transfers[];
  declare getTargetcode_transfers: Sequelize.HasManyGetAssociationsMixin<transfers>;
  declare setTargetcode_transfers: Sequelize.HasManySetAssociationsMixin<transfers, transfersId>;
  declare addTargetcode_transfer: Sequelize.HasManyAddAssociationMixin<transfers, transfersId>;
  declare addTargetcode_transfers: Sequelize.HasManyAddAssociationsMixin<transfers, transfersId>;
  declare createTargetcode_transfer: Sequelize.HasManyCreateAssociationMixin<transfers>;
  declare removeTargetcode_transfer: Sequelize.HasManyRemoveAssociationMixin<transfers, transfersId>;
  declare removeTargetcode_transfers: Sequelize.HasManyRemoveAssociationsMixin<transfers, transfersId>;
  declare hasTargetcode_transfer: Sequelize.HasManyHasAssociationMixin<transfers, transfersId>;
  declare hasTargetcode_transfers: Sequelize.HasManyHasAssociationsMixin<transfers, transfersId>;
  declare countTargetcode_transfers: Sequelize.HasManyCountAssociationsMixin;

  static initModel(sequelize: Sequelize.Sequelize): typeof element_details {
    return element_details.init({
    code: {
      type: DataTypes.STRING(255),
      allowNull: false,
      primaryKey: true
    },
    name: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    type: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'element_details',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "element_details_pkey",
        unique: true,
        fields: [
          { name: "code" },
        ]
      },
      {
        name: "element_details_type",
        fields: [
          { name: "type" },
        ]
      },
    ]
  });
  }
}
