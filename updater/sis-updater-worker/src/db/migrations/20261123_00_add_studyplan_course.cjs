module.exports = {
  up: async queryInterface => {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.sequelize.query(
        `CREATE TABLE studyplan_course (
          studyplan_id VARCHAR(255) NOT NULL REFERENCES studyplan (id) ON UPDATE CASCADE ON DELETE CASCADE,
          course_id VARCHAR(255) NOT NULL,
          PRIMARY KEY (studyplan_id, course_id)
        )`,
        { transaction }
      )
      await queryInterface.sequelize.query(
        `INSERT INTO studyplan_course (studyplan_id, course_id)
        SELECT DISTINCT studyplan_id, course_id
        FROM (
          SELECT id AS studyplan_id, unnest(included_courses) AS course_id FROM studyplan
          UNION ALL
          SELECT id AS studyplan_id, unnest(included_modules) AS course_id FROM studyplan
        ) AS included
        WHERE course_id IS NOT NULL AND course_id <> ''`,
        { transaction }
      )
    })
  },
  down: async queryInterface => {
    await queryInterface.dropTable('studyplan_course')
  },
}
