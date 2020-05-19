const { dbConnections: sisConnections } = require('../databaseV2/connection')
const { sequelizeKone } = require('../database/connection')

const byProgrammeCode = async code => {
  const connection = sisConnections.established ? sisConnections.sequelize : sequelizeKone

  const [result] = await connection.query(
    `
    WITH RECURSIVE children as (
      SELECT DISTINCT pm.*, NULL::jsonb as label_name, NULL as label_code FROM programme_modules pm
      WHERE pm.code = ?
      UNION ALL
      SELECT pm.*, c.name as label_name, c.code as label_code
      FROM children c, programme_modules pm, programme_module_children pmc
      WHERE c.id = pmc.parent_id AND pm.id = pmc.child_id
      GROUP BY pm.id, c.name, c.code
    ) SELECT * FROM children WHERE type = 'course'
  `,
    { replacements: [code] }
  )

  let order = 0

  const tunk = result.map(course => {
    const label = {
      id: course.label_name.fi,
      label: `${course.label_code}\n${course.label_name.fi}`,
      orderNumber: order++
    }

    return { ...course, label }
  })

  return tunk
}

module.exports = { byProgrammeCode }
