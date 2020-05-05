const { dbConnections } = require('../databaseV2/connection')

const byProgrammeCode = async code => {
  const [result] = await dbConnections.sequelize.query(
    `
    WITH RECURSIVE children as (
      SELECT DISTINCT pm.*, NULL::jsonb as label FROM programme_modules pm
      WHERE pm.code = ?
      UNION ALL
      SELECT pm.*, c.name as label
      FROM children c, programme_modules pm, programme_module_children pmc
      WHERE c.id = pmc.parent_id AND pm.id = pmc.child_id
      GROUP BY pm.id, c.name
    ) SELECT * FROM children WHERE type = 'course'
  `,
    { replacements: [code] }
  )

  let order = 0

  const tunk = result.map(course => {
    const label = {
      id: course.label.fi,
      label: course.label.fi,
      orderNumber: order++
    }

    return { ...course, label }
  })

  return tunk
}

module.exports = { byProgrammeCode }
