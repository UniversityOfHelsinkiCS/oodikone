const mandatoryMedical = require('../data/medicalcodes')
module.exports = {
  up: async queryInterface => {
    await queryInterface.bulkInsert(
      'mandatory_courses',
      mandatoryMedical
    )
  },
  down: async queryInterface => {
    await queryInterface.bulkDelete(
      'mandatory_courses',
      {
        studyprogramme_id: 'MH30_001'
      }
    )
  }
}
