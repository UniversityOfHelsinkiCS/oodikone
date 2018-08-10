module.exports = {
  up: async (queryInterface) => {
    await queryInterface.addIndex('transfers', {
      fields: ['studentnumber'],
      name: 'transfers_studentnumber'
    })
  },
  down: async () => {
  }
}