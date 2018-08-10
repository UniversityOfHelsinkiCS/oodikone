module.exports = {
  up: async (queryInterface) => {
    await queryInterface.addIndex('semester_enrollments', {
      fields: ['studentnumber'],
      name: 'semester_enrollment_studentnumber'
    })
  },
  down: async () => {
  }
}