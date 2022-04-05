module.exports = {
  up: async queryInterface => {
    await queryInterface.removeColumn('studyright', 'canceldate')
  },
  down: async () => {},
}
