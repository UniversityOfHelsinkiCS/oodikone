module.exports = {
  up: ({ context: queryInterface }) => {
    return queryInterface.bulkInsert('access_groups', [
      {
        group_code: 'facultyStatistics',
        group_info: 'grants access to faculty statistics',
      },
    ])
  },
  down: ({ context: queryInterface }) => {
    return queryInterface.bulkDelete('access_groups', [
      {
        group_code: 'facultyStatistics',
      },
    ])
  },
}
