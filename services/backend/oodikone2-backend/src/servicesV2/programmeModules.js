const Sequelize = require('sequelize')
const { ExcludedCourse } = require('../models/models_kone')
const { Op } = Sequelize

const { dbConnections: sisConnections } = require('../databaseV2/connection')
const { sequelizeKone } = require('../database/connection')

const byProgrammeCode = async code => {
  // TODO use only sis connection once sis is stable
  const connection = sisConnections.established ? sisConnections.sequelize : sequelizeKone

  // recursively get a module and all of its children and all of the children of the children...
  const [result] = await connection.query(
    `
    WITH RECURSIVE children as (
      SELECT DISTINCT pm.*, 0 AS module_order, NULL::jsonb AS label_name, NULL AS label_code FROM programme_modules pm
      WHERE pm.code = ?
      UNION ALL
      SELECT pm.*, c.order AS module_order, c.name AS label_name, c.code AS label_code
      FROM children c, programme_modules pm, programme_module_children pmc
      WHERE c.id = pmc.parent_id AND pm.id = pmc.child_id
      GROUP BY pm.id, c.name, c.code, c.order
    ) SELECT * FROM children WHERE type = 'course'
  `,
    { replacements: [code] }
  )

  const excluded = await ExcludedCourse.findAll({
    where: {
      programme_code: {
        [Op.eq]: code
      }
    }
  })

  // this labels the modules to match the old system in frontend
  const labeled = result.map(module => {
    const label = {
      id: module.label_name.fi,
      label: `${module.label_code}\n${module.label_name.fi}`,
      orderNumber: module.module_order
    }
    // check if course is excluded, and hide if it is
    const foundCourse = excluded.find(course => course.course_code === module.code)
    const visible = { visibility: !foundCourse, id: foundCourse ? foundCourse.id : null }

    return { ...module, label, visible }
  })

  return labeled
}

const addExcludedCourses = async (programmecode, coursecodes) => {
  return ExcludedCourse.bulkCreate(coursecodes.map(c => ({ programme_code: programmecode, course_code: c })))
}
// just copy pasted from above since almost same query
const modulesByProgrammeCode = async code => {
  const connection = sisConnections.established ? sisConnections.sequelize : sequelizeKone
  const [result] = await connection.query(
    `
    WITH RECURSIVE children as (
      SELECT DISTINCT pm.*, 0 AS module_order, NULL::jsonb AS label_name, NULL AS label_code FROM programme_modules pm
      WHERE pm.code = ?
      UNION ALL
      SELECT pm.*, c.order AS module_order, c.name AS label_name, c.code AS label_code
      FROM children c, programme_modules pm, programme_module_children pmc
      WHERE c.id = pmc.parent_id AND pm.id = pmc.child_id
      GROUP BY pm.id, c.name, c.code, c.order
    ) SELECT * FROM children WHERE type = 'module'
  `,
    { replacements: [code] }
  )

  return result
}

const removeExcludedCourses = async ids => {
  return ExcludedCourse.destroy({
    where: {
      id: {
        [Op.or]: ids
      }
    }
  })
}

module.exports = { byProgrammeCode, addExcludedCourses, removeExcludedCourses, modulesByProgrammeCode }
