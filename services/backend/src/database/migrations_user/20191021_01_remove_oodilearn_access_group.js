module.exports = {
  up: async ({ context: queryInterface }) => {
    return queryInterface.bulkDelete('access_groups', {
      group_code: 'oodilearn',
    })
  },
  down: async () => {},
}
