const { AccessGroup } = require('../../models')
const accessGroup = {
  group_code: 'faculties',
  group_info: 'grants access to faculty statistics',
}

module.exports = {
  up: async () => {
    AccessGroup.create(accessGroup)
  },
  down: async () => {
    AccessGroup.destroy({ where: { group_code: ['faculties'] } })
  }
}
