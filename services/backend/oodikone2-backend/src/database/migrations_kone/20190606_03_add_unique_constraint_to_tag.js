module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn({ tableName: 'tag', schema: 'kone_data' }, 'tag_id')
    await queryInterface.addColumn({ tableName: 'tag', schema: 'kone_data' }, 'tag_id', { type: Sequelize.BIGINT, primaryKey: true, allowNull: false, autoIncrement: true, unique:true })
  },
  down: async () => {
  }
}