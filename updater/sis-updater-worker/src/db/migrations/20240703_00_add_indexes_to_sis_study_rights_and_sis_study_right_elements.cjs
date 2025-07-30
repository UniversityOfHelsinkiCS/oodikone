module.exports = {
  up: async queryInterface => {
    await queryInterface.addIndex('sis_study_rights', ['student_number'])
    await queryInterface.addIndex('sis_study_right_elements', ['study_right_id'])
    await queryInterface.addIndex('sis_study_right_elements', ['code'])
  },
  down: async queryInterface => {
    await queryInterface.removeIndex('sis_study_rights', ['student_number'])
    await queryInterface.removeIndex('sis_study_right_elements', ['study_right_id'])
    await queryInterface.removeIndex('sis_study_right_elements', ['code'])
  },
}
