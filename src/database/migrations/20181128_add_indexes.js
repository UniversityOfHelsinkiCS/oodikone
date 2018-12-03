module.exports = {
  up: async (queryInterface) => {
    await queryInterface.addIndex('credit_teachers', ['teacher_id'])
    await queryInterface.addIndex('credit_teachers', ['credit_id'])
  },
  down: async (queryInterface) => {
    await queryInterface.removeIndex('credit_teachers', ['teacher_id'])
    await queryInterface.removeIndex('credit_teachers', ['credit_id'])
  }
}
