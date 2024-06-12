import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { course, courseId } from './course';
import type { credit_teachers, credit_teachersId } from './credit_teachers';
import type { credit_types, credit_typesId } from './credit_types';
import type { semesters, semestersId } from './semesters';
import type { student, studentId } from './student';

export interface creditAttributes {
  id: string;
  grade?: string;
  student_studentnumber?: string;
  credits?: number;
  createdate?: Date;
  credittypecode?: number;
  attainment_date?: Date;
  course_code?: string;
  semestercode?: number;
  isStudyModule?: boolean;
  org?: string;
  createdAt?: Date;
  updatedAt?: Date;
  semester_composite?: string;
  course_id?: string;
  language?: string;
  is_open?: boolean;
  studyright_id?: string;
}

export type creditPk = "id";
export type creditId = credit[creditPk];
export type creditOptionalAttributes = "grade" | "student_studentnumber" | "credits" | "createdate" | "credittypecode" | "attainment_date" | "course_code" | "semestercode" | "isStudyModule" | "org" | "createdAt" | "updatedAt" | "semester_composite" | "course_id" | "language" | "is_open" | "studyright_id";
export type creditCreationAttributes = Optional<creditAttributes, creditOptionalAttributes>;

export class credit extends Model<creditAttributes, creditCreationAttributes> implements creditAttributes {
  declare id: string;
  declare grade?: string;
  declare student_studentnumber?: string;
  declare credits?: number;
  declare createdate?: Date;
  declare credittypecode?: number;
  declare attainment_date?: Date;
  declare course_code?: string;
  declare semestercode?: number;
  declare isStudyModule?: boolean;
  declare org?: string;
  declare createdAt?: Date;
  declare updatedAt?: Date;
  declare semester_composite?: string;
  declare course_id?: string;
  declare language?: string;
  declare is_open?: boolean;
  declare studyright_id?: string;

  // credit belongsTo course via course_id
  declare course: course;
  declare getCourse: Sequelize.BelongsToGetAssociationMixin<course>;
  declare setCourse: Sequelize.BelongsToSetAssociationMixin<course, courseId>;
  declare createCourse: Sequelize.BelongsToCreateAssociationMixin<course>;
  // credit hasMany credit_teachers via credit_id
  declare credit_teachers: credit_teachers[];
  declare getCredit_teachers: Sequelize.HasManyGetAssociationsMixin<credit_teachers>;
  declare setCredit_teachers: Sequelize.HasManySetAssociationsMixin<credit_teachers, credit_teachersId>;
  declare addCredit_teacher: Sequelize.HasManyAddAssociationMixin<credit_teachers, credit_teachersId>;
  declare addCredit_teachers: Sequelize.HasManyAddAssociationsMixin<credit_teachers, credit_teachersId>;
  declare createCredit_teacher: Sequelize.HasManyCreateAssociationMixin<credit_teachers>;
  declare removeCredit_teacher: Sequelize.HasManyRemoveAssociationMixin<credit_teachers, credit_teachersId>;
  declare removeCredit_teachers: Sequelize.HasManyRemoveAssociationsMixin<credit_teachers, credit_teachersId>;
  declare hasCredit_teacher: Sequelize.HasManyHasAssociationMixin<credit_teachers, credit_teachersId>;
  declare hasCredit_teachers: Sequelize.HasManyHasAssociationsMixin<credit_teachers, credit_teachersId>;
  declare countCredit_teachers: Sequelize.HasManyCountAssociationsMixin;
  // credit belongsTo credit_types via credittypecode
  declare credittypecode_credit_type: credit_types;
  declare getCredittypecode_credit_type: Sequelize.BelongsToGetAssociationMixin<credit_types>;
  declare setCredittypecode_credit_type: Sequelize.BelongsToSetAssociationMixin<credit_types, credit_typesId>;
  declare createCredittypecode_credit_type: Sequelize.BelongsToCreateAssociationMixin<credit_types>;
  // credit belongsTo semesters via semester_composite
  declare semester_composite_semester: semesters;
  declare getSemester_composite_semester: Sequelize.BelongsToGetAssociationMixin<semesters>;
  declare setSemester_composite_semester: Sequelize.BelongsToSetAssociationMixin<semesters, semestersId>;
  declare createSemester_composite_semester: Sequelize.BelongsToCreateAssociationMixin<semesters>;
  // credit belongsTo student via student_studentnumber
  declare student_studentnumber_student: student;
  declare getStudent_studentnumber_student: Sequelize.BelongsToGetAssociationMixin<student>;
  declare setStudent_studentnumber_student: Sequelize.BelongsToSetAssociationMixin<student, studentId>;
  declare createStudent_studentnumber_student: Sequelize.BelongsToCreateAssociationMixin<student>;

  static initModel(sequelize: Sequelize.Sequelize): typeof credit {
    return credit.init({
    id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      primaryKey: true
    },
    grade: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    student_studentnumber: {
      type: DataTypes.STRING(255),
      allowNull: true,
      references: {
        model: 'student',
        key: 'studentnumber'
      }
    },
    credits: {
      type: DataTypes.DOUBLE,
      allowNull: true
    },
    createdate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    credittypecode: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'credit_types',
        key: 'credittypecode'
      }
    },
    attainment_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    course_code: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    semestercode: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    isStudyModule: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    org: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    semester_composite: {
      type: DataTypes.STRING(255),
      allowNull: true,
      references: {
        model: 'semesters',
        key: 'composite'
      }
    },
    course_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      references: {
        model: 'course',
        key: 'id'
      }
    },
    language: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    is_open: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    studyright_id: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'credit',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "credit_attainment_date",
        fields: [
          { name: "attainment_date" },
        ]
      },
      {
        name: "credit_course_code",
        fields: [
          { name: "course_code" },
        ]
      },
      {
        name: "credit_course_id",
        fields: [
          { name: "course_id" },
        ]
      },
      {
        name: "credit_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "credit_semester_composite",
        fields: [
          { name: "semester_composite" },
        ]
      },
      {
        name: "credit_student_studentnumber",
        fields: [
          { name: "student_studentnumber" },
        ]
      },
    ]
  });
  }
}
