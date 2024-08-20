module.exports = {
  up: ({ context: queryInterface }) => {
    return queryInterface.bulkInsert('access_groups', [
      {
        group_code: 'cooldata',
        group_info: 'grants access to cool data',
      },
    ])
  },
  down: async () => {},
}
