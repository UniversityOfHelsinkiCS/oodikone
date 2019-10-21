module.exports = {
  up: async queryInterface => {
    return queryInterface.bulkDelete('access_groups', {
      group_code: 'oodilearn'
    })
  },
  down: async () => {}
}
