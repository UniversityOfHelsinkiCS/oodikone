module.exports = {
  up: ({ context: queryInterface }) => {
    return queryInterface.bulkInsert('access_groups', [
      {
        group_code: 'courseStatistics',
        group_info: 'grants access to course statistics',
      },
    ])
  },
  down: async () => {},
}
