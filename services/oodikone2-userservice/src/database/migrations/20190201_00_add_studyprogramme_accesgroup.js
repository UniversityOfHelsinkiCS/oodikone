const { AccessGroup } = require('../../models')
const accessGroup = {
    group_code: 'studyprogramme',
    group_info: 'grants access to studyprogramme page',
}

module.exports = {
  up: async (queryInterface, Sequelize) => {
    AccessGroup.create(accessGroup)
  },
  down: async () => {
    AccessGroup.destroy({ where: { group_code: ['studyprogramme'] } })
  }
}