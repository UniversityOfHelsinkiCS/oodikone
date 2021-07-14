const { STRING, DATE, INTEGER } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.createTable('student', {
      studentnumber: {
        primaryKey: true,
        type: STRING,
      },
      lastname: { type: STRING },
      firstnames: { type: STRING },
      birthdate: { type: DATE },
      creditcount: { type: INTEGER },
      dateofuniversityenrollment: { type: DATE },
      email: { type: STRING },
      national_student_number: { type: STRING },
      home_county_id: { type: STRING },
      country_fi: { type: STRING },
      country_sv: { type: STRING },
      country_en: { type: STRING },
      home_country_fi: { type: STRING },
      home_country_sv: { type: STRING },
      home_country_en: { type: STRING },
      gender_code: { type: STRING },
      created_at: { type: DATE },
      updated_at: { type: DATE },
    })
  },
  down: async () => {},
}
