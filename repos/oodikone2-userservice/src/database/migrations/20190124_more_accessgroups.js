const { AccessGroup, User } = require('../../models')
defaultAccessGroups = [
  {
    group_code: 'users',
    group_info: 'grants access to users management',
  },
  {
    group_code: 'usage',
    group_info: 'grants access to usage statistics'
  },
  {
    group_code: 'oodilearn',
    group_info: 'grants access to oodilearn statistics'
  },
  {
    group_code: 'coursegroups',
    group_info: 'grants access to course groups'
  }
]
module.exports = {
  up: async (queryInterface, Sequelize) => {
    AccessGroup.bulkCreate(defaultAccessGroups)
  },
  down: async () => {
    AccessGroup.destroy({ where: { group_code: ['users', 'usage', 'oodilearn', 'coursegroups'] } })
  }
}