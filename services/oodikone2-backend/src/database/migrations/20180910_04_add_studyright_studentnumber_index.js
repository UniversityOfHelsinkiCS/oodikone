module.exports = {
  up: async (queryInterface) => {
    try {
      await queryInterface.addIndex('studyright', {
        fields: ['student_studentnumber'],
        name: 'studyright_student_studentnumber'
      })
    } catch (e) {
      console.log('studyright_student_studentnumber index in table studyright already existed')
    }
  },
  down: async () => {
  }
}