module.exports = {
  up: async (queryInterface) => {
    await queryInterface.addIndex('credit', {
      fields: ['course_code'],
      name: 'credit_course_code'
    })
  },
  down: async () => {
  }
}