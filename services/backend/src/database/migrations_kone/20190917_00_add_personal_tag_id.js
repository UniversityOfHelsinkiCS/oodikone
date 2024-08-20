const { BIGINT } = require('sequelize')

module.exports = {
  up: async ({ context: queryInterface }) => {
    await queryInterface.addColumn('tag', 'personal_user_id', {
      type: BIGINT,
    })
  },
  down: async () => {},
}
