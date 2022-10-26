module.exports = {
  up: queryInterface => {
    return queryInterface.bulkInsert('access_groups', [
      {
        group_code: 'openUniSearch',
        group_info: 'grants access to custom open uni course searches',
      },
    ])
  },
  down: queryInterface => {
    return queryInterface.bulkDelete('access_groups', [
      {
        group_code: 'openUniSearch',
      },
    ])
  },
}
