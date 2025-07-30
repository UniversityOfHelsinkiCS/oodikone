module.exports = {
  up: async queryInterface => {
    await queryInterface.addConstraint('credit_teachers', {
      fields: ['credit_id', 'teacher_id'],
      type: 'unique',
      name: 'credit_teachers_credit_id_teacher_id_unique',
    })
  },
  down: async queryInterface => {
    await queryInterface.removeConstraint('credit_teachers', 'credit_teachers_credit_id_teacher_id_unique')
  },
}
