module.exports = {
  up: queryInterface => {
    return queryInterface.bulkDelete('access_groups', [
      {
        group_code: 'faculties',
      },
    ])
  },
  down: async () => {},
}
