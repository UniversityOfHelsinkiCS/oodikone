module.exports = {
  up: async (queryInterface) => {
    try {
      await queryInterface.addIndex('transfers', {
        fields: ['studentnumber'],
        name: 'transfers_studentnumber'
      })
    } catch (e) {
      console.log('transfers_studentnumber index in table transfers already existed')
    }
  },
  down: async () => {
  }
}