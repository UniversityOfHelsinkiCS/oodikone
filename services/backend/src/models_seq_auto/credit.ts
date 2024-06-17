import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';

export class credit extends Model {
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
