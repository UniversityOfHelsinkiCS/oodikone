const { Op } = require('sequelize')

module.exports = {
  up: ({ context: queryInterface }) => {
    return queryInterface.bulkDelete('access_groups', [
      {
        group_code: { [Op.in]: ['usage', 'coursegroups'] },
      },
    ])
  },
  down: async () => {},
}
