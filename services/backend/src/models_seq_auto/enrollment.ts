import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { course, courseId } from './course';
import type { semesters, semestersId } from './semesters';
import type { student, studentId } from './student';

export interface enrollmentAttributes {
  id: string;
  studentnumber?: string;
  semestercode?: number;
  course_code?: string;
  state?: string;
  enrollment_date_time?: Date;
  course_id?: string;
  semester_composite?: string;
  createdAt?: Date;
  updatedAt?: Date;
  is_open?: boolean;
  studyright_id?: string;
}

export type enrollmentPk = "id";
export type enrollmentId = enrollment[enrollmentPk];
export type enrollmentOptionalAttributes = "studentnumber" | "semestercode" | "course_code" | "state" | "enrollment_date_time" | "course_id" | "semester_composite" | "createdAt" | "updatedAt" | "is_open" | "studyright_id";
export type enrollmentCreationAttributes = Optional<enrollmentAttributes, enrollmentOptionalAttributes>;

export class enrollment extends Model<enrollmentAttributes, enrollmentCreationAttributes> implements enrollmentAttributes {
  declare id: string;
  declare studentnumber?: string;
  declare semestercode?: number;
  declare course_code?: string;
  declare state?: string;
  declare enrollment_date_time?: Date;
  declare course_id?: string;
  declare semester_composite?: string;
  declare createdAt?: Date;
  declare updatedAt?: Date;
  declare is_open?: boolean;
  declare studyright_id?: string;

  // enrollment belongsTo course via course_id
  declare course: course;
  declare getCourse: Sequelize.BelongsToGetAssociationMixin<course>;
  declare setCourse: Sequelize.BelongsToSetAssociationMixin<course, courseId>;
  declare createCourse: Sequelize.BelongsToCreateAssociationMixin<course>;
  // enrollment belongsTo semesters via semester_composite
  declare semester_composite_semester: semesters;
  declare getSemester_composite_semester: Sequelize.BelongsToGetAssociationMixin<semesters>;
  declare setSemester_composite_semester: Sequelize.BelongsToSetAssociationMixin<semesters, semestersId>;
  declare createSemester_composite_semester: Sequelize.BelongsToCreateAssociationMixin<semesters>;
  // enrollment belongsTo student via studentnumber
  declare studentnumber_student: student;
  declare getStudentnumber_student: Sequelize.BelongsToGetAssociationMixin<student>;
  declare setStudentnumber_student: Sequelize.BelongsToSetAssociationMixin<student, studentId>;
  declare createStudentnumber_student: Sequelize.BelongsToCreateAssociationMixin<student>;

  static initModel(sequelize: Sequelize.Sequelize): typeof enrollment {
    return enrollment.init({
    id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      primaryKey: true
    },
    studentnumber: {
      type: DataTypes.STRING(255),
      allowNull: true,
      references: {
        model: 'student',
        key: 'studentnumber'
      }
    },
    semestercode: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    course_code: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    state: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    enrollment_date_time: {
      type: DataTypes.DATE,
      allowNull: true
    },
    course_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      references: {
        model: 'course',
        key: 'id'
      }
    },
    semester_composite: {
      type: DataTypes.STRING(255),
      allowNull: true,
      references: {
        model: 'semesters',
        key: 'composite'
      }
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
    tableName: 'enrollment',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "enrollment_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
  }
}
