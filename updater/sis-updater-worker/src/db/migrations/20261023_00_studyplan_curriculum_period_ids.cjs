module.exports = {
  up: async queryInterface => {
    await queryInterface.sequelize.query(`
      ALTER TABLE studyplan
      ADD COLUMN curriculum_period_ids TEXT[]
    `)
    await queryInterface.sequelize.query(`
      UPDATE studyplan s
      SET curriculum_period_ids = pm.curriculum_period_ids
      FROM programme_modules pm
      WHERE pm.code = s.programme_code
        AND s.curriculum_period_id = ANY(pm.curriculum_period_ids)
    `)
    await queryInterface.sequelize.query(`
      UPDATE studyplan
      SET curriculum_period_ids = CASE
        WHEN curriculum_period_id IS NULL OR curriculum_period_id = '' THEN '{}'::TEXT[]
        ELSE ARRAY[curriculum_period_id]
      END
      WHERE curriculum_period_ids IS NULL
    `)
    await queryInterface.sequelize.query(`
      ALTER TABLE studyplan
      DROP COLUMN curriculum_period_id
    `)
  },
  down: async queryInterface => {
    await queryInterface.sequelize.query(`
      ALTER TABLE studyplan
      ADD COLUMN curriculum_period_id VARCHAR(255)
    `)
    await queryInterface.sequelize.query(`
      UPDATE studyplan
      SET curriculum_period_id = COALESCE(curriculum_period_ids[1], '')
    `)
    await queryInterface.sequelize.query(`
      ALTER TABLE studyplan
      DROP COLUMN curriculum_period_ids
    `)
  },
}
