import { Model, BOOLEAN, DATE, DOUBLE, INTEGER, STRING } from 'sequelize'

import { sequelize } from '../connection.js'

class Credit extends Model {}

Credit.init(
  {
    id: {
      primaryKey: true,
      type: STRING,
    },
    grade: {
      type: STRING,
    },
    student_studentnumber: {
      type: STRING,
      references: {
        model: 'student',
        key: 'studentnumber',
      },
      onUpdate: 'cascade',
      onDelete: 'cascade',
    },
    credits: {
      type: DOUBLE,
    },
    createdate: {
      type: DATE,
    },
    credittypecode: {
      type: INTEGER,
      references: {
        model: 'credit_types',
        key: 'credittypecode',
      },
      onUpdate: 'cascade',
      onDelete: 'cascade',
    },
    attainment_date: {
      type: DATE,
    },
    course_code: {
      type: STRING,
    },
    course_id: {
      type: STRING,
      references: {
        model: 'course',
        key: 'id',
      },
      onUpdate: 'cascade',
      onDelete: 'cascade',
    },
    semester_composite: {
      type: STRING,
      references: {
        model: 'semesters',
        key: 'composite',
      },
      onUpdate: 'cascade',
      onDelete: 'cascade',
    },
    semestercode: {
      type: INTEGER,
    },
    isStudyModule: {
      type: BOOLEAN,
    },
    org: {
      type: STRING,
    },
    createdAt: {
      type: DATE,
    },
    updatedAt: {
      type: DATE,
    },
    language: {
      type: STRING,
    },
    is_open: {
      type: BOOLEAN,
    },
    studyright_id: {
      type: STRING,
      allowNull: true,
    },
  },
  {
    underscored: false,
    sequelize,
    modelName: 'credit',
    tableName: 'credit',
  }
)

export default Credit
