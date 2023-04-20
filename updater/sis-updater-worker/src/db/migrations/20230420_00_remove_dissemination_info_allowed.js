module.exports = {
  up: async queryInterface => {
    await queryInterface.removeColumn('student', 'dissemination_info_allowed')
  },
  down: async () => {},
}
