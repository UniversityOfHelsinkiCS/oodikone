module.exports = {
  up: queryInterface => {
    return queryInterface.bulkInsert('access_groups', [
      {
        group_code: 'facultyStatistics',
        group_info: 'grants access to faculty statistics',
      },
    ])
  },
  down: queryInterface => {
    return queryInterface.bulkDelete('access_groups', [
      {
        group_code: 'facultyStatistics',
      },
    ])
  },
}
