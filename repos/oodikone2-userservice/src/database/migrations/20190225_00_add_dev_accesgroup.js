const { AccessGroup } = require('../../models')
const accessGroup = {
    group_code: 'dev',
    group_info: 'grants access to developer UI',
}

module.exports = {
  up: async (queryInterface, Sequelize) => {
    AccessGroup.create(accessGroup)
  },
  down: async () => {
    AccessGroup.destroy({ where: { group_code: ['dev'] } })
  }
}