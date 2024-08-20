const { BIGINT, STRING, DATE } = require('sequelize')

module.exports = {
  up: async ({ context: queryInterface }) => {
    await queryInterface.createTable(
      'study_guidance_group_tags',
      {
        id: {
          primaryKey: true,
          type: BIGINT,
          autoIncrement: true,
        },
        study_guidance_group_id: {
          type: STRING,
          unique: true,
        },
        study_programme: {
          type: STRING,
        },
        year: {
          type: STRING,
        },
        created_at: {
          type: DATE,
        },
        updated_at: {
          type: DATE,
        },
      },
      { underscored: true, timestamps: true }
    )
  },
  down: async () => {},
}
