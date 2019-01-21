const { AccessGroup, User } = require('../../models')
module.exports = {
  up: async (queryInterface, Sequelize) => {
 
    AccessGroup.associate = models => {
      AccessGroup.belongsToMany(models.User, { through: 'user_accessgroup' })
    }
    User.associate = models => {
      User.belongsToMany(models.AccessGroup, { through: 'user_accessgroup', as: 'accessgroup' })
    }
  },
  down: async () => {
  }
}
