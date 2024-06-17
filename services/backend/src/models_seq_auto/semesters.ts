import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { credit, creditId } from './credit';
import type { enrollment, enrollmentId } from './enrollment';
import type { semester_enrollments, semester_enrollmentsId } from './semester_enrollments';
import type { student, studentId } from './student';

export interface semestersAttributes {
  composite: string;
  semestercode?: number;
  name?: object;
  startdate?: Date;
  enddate?: Date;
  yearcode?: number;
  org?: string;
  yearname?: string;
  created_at?: Date;
  updated_at?: Date;
  term_index?: number;
  start_year?: number;
}

export type semestersPk = "composite";
export type semestersId = semesters[semestersPk];
export type semestersOptionalAttributes = "semestercode" | "name" | "startdate" | "enddate" | "yearcode" | "org" | "yearname" | "created_at" | "updated_at" | "term_index" | "start_year";
export type semestersCreationAttributes = Optional<semestersAttributes, semestersOptionalAttributes>;

export class semesters extends Model<semestersAttributes, semestersCreationAttributes> implements semestersAttributes {
  declare composite: string;
  declare semestercode?: number;
  declare name?: object;
  declare startdate?: Date;
  declare enddate?: Date;
  declare yearcode?: number;
  declare org?: string;
  declare yearname?: string;
  declare created_at?: Date;
  declare updated_at?: Date;
  declare term_index?: number;
  declare start_year?: number;

  // semesters hasMany credit via semester_composite
  declare credits: credit[];
  declare getCredits: Sequelize.HasManyGetAssociationsMixin<credit>;
  declare setCredits: Sequelize.HasManySetAssociationsMixin<credit, creditId>;
  declare addCredit: Sequelize.HasManyAddAssociationMixin<credit, creditId>;
  declare addCredits: Sequelize.HasManyAddAssociationsMixin<credit, creditId>;
  declare createCredit: Sequelize.HasManyCreateAssociationMixin<credit>;
  declare removeCredit: Sequelize.HasManyRemoveAssociationMixin<credit, creditId>;
  declare removeCredits: Sequelize.HasManyRemoveAssociationsMixin<credit, creditId>;
  declare hasCredit: Sequelize.HasManyHasAssociationMixin<credit, creditId>;
  declare hasCredits: Sequelize.HasManyHasAssociationsMixin<credit, creditId>;
  declare countCredits: Sequelize.HasManyCountAssociationsMixin;
  // semesters hasMany enrollment via semester_composite
  declare enrollments: enrollment[];
  declare getEnrollments: Sequelize.HasManyGetAssociationsMixin<enrollment>;
  declare setEnrollments: Sequelize.HasManySetAssociationsMixin<enrollment, enrollmentId>;
  declare addEnrollment: Sequelize.HasManyAddAssociationMixin<enrollment, enrollmentId>;
  declare addEnrollments: Sequelize.HasManyAddAssociationsMixin<enrollment, enrollmentId>;
  declare createEnrollment: Sequelize.HasManyCreateAssociationMixin<enrollment>;
  declare removeEnrollment: Sequelize.HasManyRemoveAssociationMixin<enrollment, enrollmentId>;
  declare removeEnrollments: Sequelize.HasManyRemoveAssociationsMixin<enrollment, enrollmentId>;
  declare hasEnrollment: Sequelize.HasManyHasAssociationMixin<enrollment, enrollmentId>;
  declare hasEnrollments: Sequelize.HasManyHasAssociationsMixin<enrollment, enrollmentId>;
  declare countEnrollments: Sequelize.HasManyCountAssociationsMixin;
  // semesters hasMany semester_enrollments via semestercomposite
  declare semester_enrollments: semester_enrollments[];
  declare getSemester_enrollments: Sequelize.HasManyGetAssociationsMixin<semester_enrollments>;
  declare setSemester_enrollments: Sequelize.HasManySetAssociationsMixin<semester_enrollments, semester_enrollmentsId>;
  declare addSemester_enrollment: Sequelize.HasManyAddAssociationMixin<semester_enrollments, semester_enrollmentsId>;
  declare addSemester_enrollments: Sequelize.HasManyAddAssociationsMixin<semester_enrollments, semester_enrollmentsId>;
  declare createSemester_enrollment: Sequelize.HasManyCreateAssociationMixin<semester_enrollments>;
  declare removeSemester_enrollment: Sequelize.HasManyRemoveAssociationMixin<semester_enrollments, semester_enrollmentsId>;
  declare removeSemester_enrollments: Sequelize.HasManyRemoveAssociationsMixin<semester_enrollments, semester_enrollmentsId>;
  declare hasSemester_enrollment: Sequelize.HasManyHasAssociationMixin<semester_enrollments, semester_enrollmentsId>;
  declare hasSemester_enrollments: Sequelize.HasManyHasAssociationsMixin<semester_enrollments, semester_enrollmentsId>;
  declare countSemester_enrollments: Sequelize.HasManyCountAssociationsMixin;
  // semesters belongsToMany student via semestercomposite and studentnumber
  declare studentnumber_students: student[];
  declare getStudentnumber_students: Sequelize.BelongsToManyGetAssociationsMixin<student>;
  declare setStudentnumber_students: Sequelize.BelongsToManySetAssociationsMixin<student, studentId>;
  declare addStudentnumber_student: Sequelize.BelongsToManyAddAssociationMixin<student, studentId>;
  declare addStudentnumber_students: Sequelize.BelongsToManyAddAssociationsMixin<student, studentId>;
  declare createStudentnumber_student: Sequelize.BelongsToManyCreateAssociationMixin<student>;
  declare removeStudentnumber_student: Sequelize.BelongsToManyRemoveAssociationMixin<student, studentId>;
  declare removeStudentnumber_students: Sequelize.BelongsToManyRemoveAssociationsMixin<student, studentId>;
  declare hasStudentnumber_student: Sequelize.BelongsToManyHasAssociationMixin<student, studentId>;
  declare hasStudentnumber_students: Sequelize.BelongsToManyHasAssociationsMixin<student, studentId>;
  declare countStudentnumber_students: Sequelize.BelongsToManyCountAssociationsMixin;

  static initModel(sequelize: Sequelize.Sequelize): typeof semesters {
    return semesters.init({
    composite: {
      type: DataTypes.STRING(255),
      allowNull: false,
      primaryKey: true
    },
    semestercode: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    name: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    startdate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    enddate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    yearcode: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    org: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    yearname: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    term_index: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    start_year: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'semesters',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "semesters_pkey",
        unique: true,
        fields: [
          { name: "composite" },
        ]
      },
    ]
  });
  }
}
