module.exports = {
  up: async (queryInterface) => {
    return queryInterface.bulkInsert('access_groups', [
      {
        group_code: 'faculties',
        group_info: 'grants access to faculty statistics',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ])
  },
  down: async () => {
  }
}
