module.exports = {
  up: async queryInterface => {
    await queryInterface.removeColumn('users', 'iam_groups')
  },
  down: async () => {},
}
