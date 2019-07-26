const { AccessGroup } = require('../../models')
const defaultAccessGroups = [
  {
    group_code: 'teachers',
    group_info: 'grants access to teacher statistics',
  },
  {
    group_code: 'admin',
    group_info: 'grants access to everything'
  }
]
module.exports = {
  up: async () => {
    AccessGroup.bulkCreate(defaultAccessGroups)
  },
  down: async () => {
    AccessGroup.destroy({ where: { group_code: ['teachers', 'admin'] } })
  }
}