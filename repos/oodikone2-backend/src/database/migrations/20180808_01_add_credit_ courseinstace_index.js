module.exports = {
  up: async (queryInterface) => {
    queryInterface.addIndex('credit', {
      fields: ['courseinstance_id'],
      name: 'credit_courseinstance_id'
    })
  },
  down: async () => {
  }
}