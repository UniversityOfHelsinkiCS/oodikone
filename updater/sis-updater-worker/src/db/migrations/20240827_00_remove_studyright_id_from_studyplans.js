module.exports = {
  up: async queryInterface => {
    await queryInterface.removeColumn('studyplan', 'studyrightid')
  },
  down: async queryInterface => {
    await queryInterface.addColumn('studyplan', 'studyrightid', {
      type: STRING,
      references: {
        model: 'studyright',
        key: 'studyrightid',
      },
      onUpdate: 'cascade',
      onDelete: 'cascade',
      allowNull: false,
    })
  },
}
