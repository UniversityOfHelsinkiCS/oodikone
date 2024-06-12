import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { student, studentId } from './student';
import type { studyright, studyrightId } from './studyright';

export interface studyplanAttributes {
  id: string;
  studentnumber: string;
  studyrightid: string;
  completed_credits?: number;
  programme_code: string;
  included_courses?: string[];
  createdAt?: Date;
  updatedAt?: Date;
  sisu_id?: string;
  curriculum_period_id?: string;
}

export type studyplanPk = "id";
export type studyplanId = studyplan[studyplanPk];
export type studyplanOptionalAttributes = "completed_credits" | "included_courses" | "createdAt" | "updatedAt" | "sisu_id" | "curriculum_period_id";
export type studyplanCreationAttributes = Optional<studyplanAttributes, studyplanOptionalAttributes>;

export class studyplan extends Model<studyplanAttributes, studyplanCreationAttributes> implements studyplanAttributes {
  declare id: string;
  declare studentnumber: string;
  declare studyrightid: string;
  declare completed_credits?: number;
  declare programme_code: string;
  declare included_courses?: string[];
  declare createdAt?: Date;
  declare updatedAt?: Date;
  declare sisu_id?: string;
  declare curriculum_period_id?: string;

  // studyplan belongsTo student via studentnumber
  declare studentnumber_student: student;
  declare getStudentnumber_student: Sequelize.BelongsToGetAssociationMixin<student>;
  declare setStudentnumber_student: Sequelize.BelongsToSetAssociationMixin<student, studentId>;
  declare createStudentnumber_student: Sequelize.BelongsToCreateAssociationMixin<student>;
  // studyplan belongsTo studyright via studyrightid
  declare studyright: studyright;
  declare getStudyright: Sequelize.BelongsToGetAssociationMixin<studyright>;
  declare setStudyright: Sequelize.BelongsToSetAssociationMixin<studyright, studyrightId>;
  declare createStudyright: Sequelize.BelongsToCreateAssociationMixin<studyright>;

  static initModel(sequelize: Sequelize.Sequelize): typeof studyplan {
    return studyplan.init({
    id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      primaryKey: true
    },
    studentnumber: {
      type: DataTypes.STRING(255),
      allowNull: false,
      references: {
        model: 'student',
        key: 'studentnumber'
      }
    },
    studyrightid: {
      type: DataTypes.STRING(255),
      allowNull: false,
      references: {
        model: 'studyright',
        key: 'studyrightid'
      }
    },
    completed_credits: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    programme_code: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    included_courses: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true
    },
    sisu_id: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    curriculum_period_id: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'studyplan',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "studyplan_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
  }
}
