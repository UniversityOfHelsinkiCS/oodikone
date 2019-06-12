module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn({ tableName: 'tag_student', schema: 'kone_data' }, 'tag_id')
    await queryInterface.addColumn({ tableName: 'tag_student', schema: 'kone_data' }, 'id', { type: Sequelize.BIGINT, primaryKey: true, allowNull: false, autoIncrement: true })
    await queryInterface.sequelize.query(`ALTER TABLE tag_student ADD PRIMARY KEY (id);`)
    await queryInterface.addColumn({ tableName: 'tag_student', schema: 'kone_data' }, 'tag_id', {
      type: Sequelize.BIGINT,
      allowNull: false,
      references: {
        model: 'tag',
        key: 'tag_id'
      },
    })
  },
  down: async () => {
  }
}