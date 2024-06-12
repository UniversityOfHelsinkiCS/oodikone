import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { element_details, element_detailsId } from './element_details';
import type { student, studentId } from './student';
import type { studyright, studyrightId } from './studyright';

export interface studyright_elementsAttributes {
  id: string;
  startdate?: Date;
  enddate?: Date;
  studyrightid?: string;
  code?: string;
  studentnumber?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type studyright_elementsPk = "id";
export type studyright_elementsId = studyright_elements[studyright_elementsPk];
export type studyright_elementsOptionalAttributes = "startdate" | "enddate" | "studyrightid" | "code" | "studentnumber" | "createdAt" | "updatedAt";
export type studyright_elementsCreationAttributes = Optional<studyright_elementsAttributes, studyright_elementsOptionalAttributes>;

export class studyright_elements extends Model<studyright_elementsAttributes, studyright_elementsCreationAttributes> implements studyright_elementsAttributes {
  declare id: string;
  declare startdate?: Date;
  declare enddate?: Date;
  declare studyrightid?: string;
  declare code?: string;
  declare studentnumber?: string;
  declare createdAt?: Date;
  declare updatedAt?: Date;

  // studyright_elements belongsTo element_details via code
  declare code_element_detail: element_details;
  declare getCode_element_detail: Sequelize.BelongsToGetAssociationMixin<element_details>;
  declare setCode_element_detail: Sequelize.BelongsToSetAssociationMixin<element_details, element_detailsId>;
  declare createCode_element_detail: Sequelize.BelongsToCreateAssociationMixin<element_details>;
  // studyright_elements belongsTo student via studentnumber
  declare studentnumber_student: student;
  declare getStudentnumber_student: Sequelize.BelongsToGetAssociationMixin<student>;
  declare setStudentnumber_student: Sequelize.BelongsToSetAssociationMixin<student, studentId>;
  declare createStudentnumber_student: Sequelize.BelongsToCreateAssociationMixin<student>;
  // studyright_elements belongsTo studyright via studyrightid
  declare studyright: studyright;
  declare getStudyright: Sequelize.BelongsToGetAssociationMixin<studyright>;
  declare setStudyright: Sequelize.BelongsToSetAssociationMixin<studyright, studyrightId>;
  declare createStudyright: Sequelize.BelongsToCreateAssociationMixin<studyright>;

  static initModel(sequelize: Sequelize.Sequelize): typeof studyright_elements {
    return studyright_elements.init({
    id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      primaryKey: true
    },
    startdate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    enddate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    studyrightid: {
      type: DataTypes.STRING(255),
      allowNull: true,
      references: {
        model: 'studyright',
        key: 'studyrightid'
      }
    },
    code: {
      type: DataTypes.STRING(255),
      allowNull: true,
      references: {
        model: 'element_details',
        key: 'code'
      }
    },
    studentnumber: {
      type: DataTypes.STRING(255),
      allowNull: true,
      references: {
        model: 'student',
        key: 'studentnumber'
      }
    }
  }, {
    sequelize,
    tableName: 'studyright_elements',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "studyright_elements_code",
        fields: [
          { name: "code" },
        ]
      },
      {
        name: "studyright_elements_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "studyright_elements_startdate",
        fields: [
          { name: "startdate" },
        ]
      },
      {
        name: "studyright_elements_studentnumber",
        fields: [
          { name: "studentnumber" },
        ]
      },
      {
        name: "studyright_elements_studyrightid",
        fields: [
          { name: "studyrightid" },
        ]
      },
    ]
  });
  }
}
