module.exports = {
  up: async (queryInterface) => {
    await queryInterface.addIndex('credit', {
      fields: ['attainment_date'],
      name: 'credit_attainment_date'
    })
  },
  down: async () => {
  }
}