module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('credit_teachers', {
      createdAt: {
        type: Sequelize.DATE
      },
      updatedAt: {
        type: Sequelize.DATE
      },
      credit_id: {
        type: Sequelize.STRING,
        primaryKey: true,
        references: {
          model: 'credit',
          key: 'id'
        }
      },
      teacher_id: {
        type: Sequelize.STRING,
        primaryKey: true,        
        references: {
          model: 'teacher',
          key: 'id'
        } 
      }
    })
  },
  down: async () => {
  }
}