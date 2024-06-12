import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { element_details, element_detailsId } from './element_details';
import type { student, studentId } from './student';
import type { studyright, studyrightId } from './studyright';

export interface transfersAttributes {
  id: string;
  sourcecode?: string;
  targetcode?: string;
  transferdate?: Date;
  studentnumber?: string;
  studyrightid?: string;
  created_at?: Date;
  updated_at?: Date;
}

export type transfersPk = "id";
export type transfersId = transfers[transfersPk];
export type transfersOptionalAttributes = "sourcecode" | "targetcode" | "transferdate" | "studentnumber" | "studyrightid" | "created_at" | "updated_at";
export type transfersCreationAttributes = Optional<transfersAttributes, transfersOptionalAttributes>;

export class transfers extends Model<transfersAttributes, transfersCreationAttributes> implements transfersAttributes {
  declare id: string;
  declare sourcecode?: string;
  declare targetcode?: string;
  declare transferdate?: Date;
  declare studentnumber?: string;
  declare studyrightid?: string;
  declare created_at?: Date;
  declare updated_at?: Date;

  // transfers belongsTo element_details via sourcecode
  declare sourcecode_element_detail: element_details;
  declare getSourcecode_element_detail: Sequelize.BelongsToGetAssociationMixin<element_details>;
  declare setSourcecode_element_detail: Sequelize.BelongsToSetAssociationMixin<element_details, element_detailsId>;
  declare createSourcecode_element_detail: Sequelize.BelongsToCreateAssociationMixin<element_details>;
  // transfers belongsTo element_details via targetcode
  declare targetcode_element_detail: element_details;
  declare getTargetcode_element_detail: Sequelize.BelongsToGetAssociationMixin<element_details>;
  declare setTargetcode_element_detail: Sequelize.BelongsToSetAssociationMixin<element_details, element_detailsId>;
  declare createTargetcode_element_detail: Sequelize.BelongsToCreateAssociationMixin<element_details>;
  // transfers belongsTo student via studentnumber
  declare studentnumber_student: student;
  declare getStudentnumber_student: Sequelize.BelongsToGetAssociationMixin<student>;
  declare setStudentnumber_student: Sequelize.BelongsToSetAssociationMixin<student, studentId>;
  declare createStudentnumber_student: Sequelize.BelongsToCreateAssociationMixin<student>;
  // transfers belongsTo studyright via studyrightid
  declare studyright: studyright;
  declare getStudyright: Sequelize.BelongsToGetAssociationMixin<studyright>;
  declare setStudyright: Sequelize.BelongsToSetAssociationMixin<studyright, studyrightId>;
  declare createStudyright: Sequelize.BelongsToCreateAssociationMixin<studyright>;

  static initModel(sequelize: Sequelize.Sequelize): typeof transfers {
    return transfers.init({
    id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      primaryKey: true
    },
    sourcecode: {
      type: DataTypes.STRING(255),
      allowNull: true,
      references: {
        model: 'element_details',
        key: 'code'
      }
    },
    targetcode: {
      type: DataTypes.STRING(255),
      allowNull: true,
      references: {
        model: 'element_details',
        key: 'code'
      }
    },
    transferdate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    studentnumber: {
      type: DataTypes.STRING(255),
      allowNull: true,
      references: {
        model: 'student',
        key: 'studentnumber'
      }
    },
    studyrightid: {
      type: DataTypes.STRING(255),
      allowNull: true,
      references: {
        model: 'studyright',
        key: 'studyrightid'
      }
    }
  }, {
    sequelize,
    tableName: 'transfers',
    schema: 'public',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        name: "transfers_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "transfers_sourcecode",
        fields: [
          { name: "sourcecode" },
        ]
      },
      {
        name: "transfers_studentnumber",
        fields: [
          { name: "studentnumber" },
        ]
      },
      {
        name: "transfers_targetcode",
        fields: [
          { name: "targetcode" },
        ]
      },
    ]
  });
  }
}
