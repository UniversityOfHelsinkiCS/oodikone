import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { semesters, semestersId } from './semesters';
import type { student, studentId } from './student';

export interface semester_enrollmentsAttributes {
  enrollmenttype?: number;
  org?: string;
  studentnumber: string;
  semestercode?: number;
  semestercomposite: string;
  statutory_absence?: boolean;
  enrollment_date?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export type semester_enrollmentsPk = "studentnumber" | "semestercomposite";
export type semester_enrollmentsId = semester_enrollments[semester_enrollmentsPk];
export type semester_enrollmentsOptionalAttributes = "enrollmenttype" | "org" | "semestercode" | "statutory_absence" | "enrollment_date" | "createdAt" | "updatedAt";
export type semester_enrollmentsCreationAttributes = Optional<semester_enrollmentsAttributes, semester_enrollmentsOptionalAttributes>;

export class semester_enrollments extends Model<semester_enrollmentsAttributes, semester_enrollmentsCreationAttributes> implements semester_enrollmentsAttributes {
  declare enrollmenttype?: number;
  declare org?: string;
  declare studentnumber: string;
  declare semestercode?: number;
  declare semestercomposite: string;
  declare statutory_absence?: boolean;
  declare enrollment_date?: Date;
  declare createdAt?: Date;
  declare updatedAt?: Date;

  // semester_enrollments belongsTo semesters via semestercomposite
  declare semestercomposite_semester: semesters;
  declare getSemestercomposite_semester: Sequelize.BelongsToGetAssociationMixin<semesters>;
  declare setSemestercomposite_semester: Sequelize.BelongsToSetAssociationMixin<semesters, semestersId>;
  declare createSemestercomposite_semester: Sequelize.BelongsToCreateAssociationMixin<semesters>;
  // semester_enrollments belongsTo student via studentnumber
  declare studentnumber_student: student;
  declare getStudentnumber_student: Sequelize.BelongsToGetAssociationMixin<student>;
  declare setStudentnumber_student: Sequelize.BelongsToSetAssociationMixin<student, studentId>;
  declare createStudentnumber_student: Sequelize.BelongsToCreateAssociationMixin<student>;

  static initModel(sequelize: Sequelize.Sequelize): typeof semester_enrollments {
    return semester_enrollments.init({
    enrollmenttype: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    org: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    studentnumber: {
      type: DataTypes.STRING(255),
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'student',
        key: 'studentnumber'
      }
    },
    semestercode: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    semestercomposite: {
      type: DataTypes.STRING(255),
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'semesters',
        key: 'composite'
      }
    },
    statutory_absence: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    enrollment_date: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'semester_enrollments',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "semester_enrollments_pkey",
        unique: true,
        fields: [
          { name: "studentnumber" },
          { name: "semestercomposite" },
        ]
      },
      {
        name: "semester_enrollments_semestercomposite",
        fields: [
          { name: "semestercomposite" },
        ]
      },
      {
        name: "semester_enrollments_studentnumber",
        fields: [
          { name: "studentnumber" },
        ]
      },
    ]
  });
  }
}
