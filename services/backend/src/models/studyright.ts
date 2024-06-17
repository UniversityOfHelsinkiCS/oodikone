import * as Sequelize from 'sequelize';

const { Model, JSONB, INTEGER, STRING, DATE, BOOLEAN } = Sequelize

import { dbConnections } from '../database/connection';

export interface studyrightAttributes {
  studyrightid: string;
  startdate?: Date;
  enddate?: Date;
  givendate?: Date;
  studystartdate?: Date;
  graduated?: number;
  studentStudentnumber?: string;
  facultyCode?: string;
  prioritycode?: number;
  extentcode?: number;
  createdAt?: Date;
  updatedAt?: Date;
  admission_type?: string;
  active?: number;
  cancelled?: boolean;
  actual_studyrightid?: string;
  is_ba_ma?: boolean;
  semesterEnrollments?: object;
}
export type studyrightPk = "studyrightid";
export type studyrightId = Studyright[studyrightPk];
export type studyrightOptionalAttributes = "startdate" | "enddate" | "givendate" | "studystartdate" | "graduated" | "studentStudentnumber" | "facultyCode" | "prioritycode" | "extentcode" | "createdAt" | "updatedAt" | "admission_type" | "active" | "cancelled" | "actual_studyrightid" | "is_ba_ma" | "semesterEnrollments";

export type studyrightCreationAttributes = Sequelize.Optional<studyrightAttributes, studyrightOptionalAttributes>;

export class Studyright
  extends Model<studyrightAttributes, studyrightCreationAttributes>
  implements studyrightAttributes
{
  declare studyrightid: string
  declare startdate?: Date
  declare enddate?: Date
  declare givendate?: Date
  declare studystartdate?: Date
  declare graduated?: number
  declare studentStudentnumber?: string
  declare facultyCode?: string
  declare prioritycode?: number
  declare extentcode?: number
  declare createdAt?: Date
  declare updatedAt?: Date
  declare admission_type?: string
  declare active?: number
  declare cancelled?: boolean
  declare actual_studyrightid?: string
  declare is_ba_ma?: boolean
  declare semesterEnrollments?: object

  static initModel(): typeof Studyright {
      return Studyright.init({
        studyrightid: {
          primaryKey: true,
          type: STRING,
        },
        actual_studyrightid: {
          type: STRING,
        },
        startdate: {
          type: DATE,
        },
        enddate: {
          type: DATE,
        },
        givendate: {
          type: DATE,
        },
        studystartdate: {
          type: DATE,
        },
        graduated: {
          type: INTEGER,
        },
        active: {
          type: INTEGER,
        },
        cancelled: {
          type: BOOLEAN,
        },
        studentStudentnumber: {
          type: STRING,
          references: {
            model: 'student',
            key: 'studentnumber',
          },
          onUpdate: 'cascade',
          onDelete: 'cascade',
        },
        facultyCode: {
          type: STRING,
        },
        prioritycode: {
          type: INTEGER,
        },
        extentcode: {
          type: INTEGER,
          references: {
            model: 'studyright_extents',
            key: 'extentcode',
          },
          onUpdate: 'cascade',
          onDelete: 'cascade',
        },
        createdAt: {
          type: DATE,
        },
        updatedAt: {
          type: DATE,
        },
        admission_type: {
          type: STRING,
        },
        is_ba_ma: {
          type: BOOLEAN,
        },
        semesterEnrollments: {
          type: JSONB,
        },
      },
      {
        underscored: true,
        sequelize: dbConnections.sequelize,
        modelName: 'studyright',
        tableName: 'studyright',
      }
    )
  }
}
