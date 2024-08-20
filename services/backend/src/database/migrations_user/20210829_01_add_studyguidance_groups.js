module.exports = {
  up: ({ context: queryInterface }) => {
    return queryInterface.bulkInsert('access_groups', [
      {
        group_code: 'studyGuidanceGroups',
        group_info: 'grants access to person groups feature',
      },
    ])
  },
  down: ({ context: queryInterface }) => {
    return queryInterface.bulkDelete('access_groups', [
      {
        group_code: 'studyGuidanceGroups',
      },
    ])
  },
}
