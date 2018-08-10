module.exports = {
  up: async (queryInterface) => {
    await queryInterface.addIndex('studyright', {
      fields: ['student_studentnumber'],
      name: 'studyright_student_studentnumber'
    })
  },
  down: async () => {
  }
}