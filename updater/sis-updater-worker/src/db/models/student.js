const { Model, STRING, DATE, INTEGER } = require('sequelize')
const { dbConnections } = require('../connection')

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
    national_student_number: { type: STRING },
    country_fi: { type: STRING },
    country_sv: { type: STRING },
    country_en: { type: STRING },
    home_country_fi: { type: STRING },
    home_country_sv: { type: STRING },
    home_country_en: { type: STRING },
    gender_code: { type: INTEGER },
    sis_person_id: { type: STRING },
    createdAt: {
      type: DATE,
    },
    updatedAt: {
      type: DATE,
    },
  },
  {
    underscored: true,
    sequelize: dbConnections.sequelize,
    modelName: 'student',
    tableName: 'student',
  }
)

module.exports = Student
