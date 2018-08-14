module.exports = {
  up: async (queryInterface) => {
    try {
      await queryInterface.addIndex('transfers', {
        fields: ['studentnumber'],
        name: 'transfers_studentnumber'
      })
    } catch (e) {
      console.log('yolo')
    }
  },
  down: async () => {
  }
}