module.exports = {
  up: async queryInterface => {
    await Promise.all([
      queryInterface.addIndex('organization', ['code']),
      queryInterface.addIndex('credit', ['attainment_date']),
      queryInterface.addIndex('credit', ['course_code']),
      queryInterface.addIndex('credit', ['student_studentnumber']),
      queryInterface.addIndex('studyright', ['student_studentnumber']),
      queryInterface.addIndex('studyright', ['canceldate']),
      queryInterface.addIndex('studyright', ['extentcode']),
      queryInterface.addIndex('studyright_elements', ['studentnumber']),
      queryInterface.addIndex('studyright_elements', ['studyrightid']),
      queryInterface.addIndex('studyright_elements', ['code']),
      queryInterface.addIndex('studyright_elements', ['startdate']),
      queryInterface.addIndex('semester_enrollments', ['studentnumber']),
      queryInterface.addIndex('element_details', ['type']),
    ])
  },
  down: async () => {},
}
