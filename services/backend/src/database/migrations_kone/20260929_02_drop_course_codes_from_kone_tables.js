/* eslint-disable no-console */
const { ARRAY, STRING } = require('sequelize')

const YEARS = ['one', 'two', 'three', 'four', 'five', 'six']
const UNIQUE_CONSTRAINT = 'excluded_courses_programme_version_group_key'

// Migration step 2 of 2
// Rows the backfill could not map to a course group id are removed, as they no longer reference a course.
// NOTE: down only restores the schema, the dropped course codes cannot be restored.
module.exports = {
  up: async ({ context: queryInterface }) => {
    await queryInterface.sequelize.transaction(async transaction => {
      const [, unmapped] = await queryInterface.sequelize.query(
        'DELETE FROM excluded_courses WHERE course_group_id IS NULL',
        { transaction }
      )
      console.log(`Deleted ${unmapped.rowCount} excluded courses without a course group id`)

      const [, duplicates] = await queryInterface.sequelize.query(
        `DELETE FROM excluded_courses a
          USING excluded_courses b
          WHERE a.id > b.id
            AND a.programme_code = b.programme_code
            AND a.curriculum_version IS NOT DISTINCT FROM b.curriculum_version
            AND a.course_group_id = b.course_group_id`,
        { transaction }
      )
      console.log(`Deleted ${duplicates.rowCount} duplicate excluded courses`)

      await queryInterface.removeColumn('excluded_courses', 'course_code', { transaction })
      await queryInterface.changeColumn(
        'excluded_courses',
        'course_group_id',
        { type: STRING, allowNull: false },
        { transaction }
      )
      await queryInterface.addConstraint('excluded_courses', {
        fields: ['programme_code', 'curriculum_version', 'course_group_id'],
        type: 'unique',
        name: UNIQUE_CONSTRAINT,
        transaction,
      })

      for (const year of YEARS) {
        const [[{ count }]] = await queryInterface.sequelize.query(
          `SELECT COUNT(*) AS count FROM progress_criteria
            WHERE course_group_ids_year_${year} IS NULL AND cardinality(courses_year_${year}) > 0`,
          { transaction }
        )
        console.log(`Emptied year ${year} of ${count} progress criteria without course group ids`)

        await queryInterface.sequelize.query(
          `UPDATE progress_criteria SET course_group_ids_year_${year} = '{}' WHERE course_group_ids_year_${year} IS NULL`,
          { transaction }
        )
        await queryInterface.removeColumn('progress_criteria', `courses_year_${year}`, { transaction })
        await queryInterface.changeColumn(
          'progress_criteria',
          `course_group_ids_year_${year}`,
          { type: ARRAY(STRING), allowNull: false, defaultValue: [] },
          { transaction }
        )
      }
    })
  },

  down: async ({ context: queryInterface }) => {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.removeConstraint('excluded_courses', UNIQUE_CONSTRAINT, { transaction })
      await queryInterface.changeColumn(
        'excluded_courses',
        'course_group_id',
        { type: STRING, allowNull: true },
        { transaction }
      )
      await queryInterface.addColumn('excluded_courses', 'course_code', { type: STRING }, { transaction })

      for (const year of YEARS) {
        await queryInterface.changeColumn(
          'progress_criteria',
          `course_group_ids_year_${year}`,
          { type: ARRAY(STRING), allowNull: true, defaultValue: null },
          { transaction }
        )
        await queryInterface.addColumn(
          'progress_criteria',
          `courses_year_${year}`,
          { type: ARRAY(STRING) },
          { transaction }
        )
      }
    })
  },
}
