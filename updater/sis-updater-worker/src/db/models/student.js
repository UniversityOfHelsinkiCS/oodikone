import { Model, DATE, INTEGER, STRING, BOOLEAN, JSONB } from 'sequelize'

import { sequelize } from '../connection.js'

class Student extends Model {}

Student.init(
  {
    studentnumber: {
      primaryKey: true,
      type: STRING,
    },
    lastname: { type: STRING },
    firstnames: { type: STRING },
    abbreviatedname: { type: STRING },
    birthdate: { type: DATE },
    creditcount: { type: INTEGER },
    dateofuniversityenrollment: { type: DATE },
    email: { type: STRING },
    phone_number: { type: STRING },
    secondary_email: { type: STRING },
    national_student_number: { type: STRING },
    citizenships: { type: JSONB },
    gender_code: { type: STRING },
    sis_person_id: { type: STRING },
    hasPersonalIdentityCode: { type: BOOLEAN },
    preferredLanguage: { type: STRING },
    createdAt: {
      type: DATE,
    },
    updatedAt: {
      type: DATE,
    },
  },
  {
    underscored: true,
    sequelize,
    modelName: 'student',
    tableName: 'student',
  }
)

export default Student
