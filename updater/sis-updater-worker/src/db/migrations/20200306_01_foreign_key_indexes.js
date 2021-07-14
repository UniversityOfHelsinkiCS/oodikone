module.exports = {
  up: async queryInterface => {
    await Promise.all([
      queryInterface.addIndex('credit_teachers', ['credit_id']),
      queryInterface.addIndex('credit_teachers', ['teacher_id']),
      queryInterface.addIndex('credit', ['course_id']),
      queryInterface.addIndex('credit', ['semester_composite']),
      queryInterface.addIndex('course_providers', ['coursecode']),
      queryInterface.addIndex('course_providers', ['organizationcode']),
      queryInterface.addIndex('semester_enrollments', ['semestercomposite']),
    ])
  },
  down: async () => {},
}
