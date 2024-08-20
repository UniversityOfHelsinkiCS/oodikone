module.exports = {
  up: async ({ context: queryInterface }) => {
    await queryInterface.removeColumn('users', 'iam_groups')
  },
  down: async () => {},
}
