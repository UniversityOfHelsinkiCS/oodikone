const { dbConnections: sisConnections } = require('../databaseV2/connection')
const { sequelizeKone } = require('../database/connection')

const byProgrammeCode = async code => {
  const connection = sisConnections.established ? sisConnections.sequelize : sequelizeKone

  const [result] = await connection.query(
    `
    WITH RECURSIVE children as (
      SELECT DISTINCT pm.*, NULL::jsonb AS label_name, NULL AS label_code FROM programme_modules pm
      WHERE pm.code = ?
      UNION ALL
      SELECT pm.*, c.name AS label_name, c.code AS label_code
      FROM children c, programme_modules pm, programme_module_children pmc
      WHERE c.id = pmc.parent_id AND pm.id = pmc.child_id
      GROUP BY pm.id, c.name, c.code
    ) SELECT * FROM children WHERE type = 'course'
  `,
    { replacements: [code] }
  )

  let order = 0

  const labeled = result.map(module => {
    const label = {
      id: module.label_name.fi,
      label: `${module.label_code}\n${module.label_name.fi}`,
      orderNumber: order++
    }

    return { ...module, label }
  })

  return labeled
}

module.exports = { byProgrammeCode }
