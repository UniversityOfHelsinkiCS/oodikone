const Sequelize = require('sequelize')
const { ExcludedCourse } = require('../models/models_kone')
const { Op } = Sequelize
const logger = require('../util/logger')

const { dbConnections } = require('../database/connection')

const recursivelyGetModuleAndChildren = async (code, type) => {
  const connection = dbConnections.sequelize
  try {
    const [result] = await connection.query(
      `WITH RECURSIVE children as (
        SELECT DISTINCT pm.*, 0 AS module_order, NULL::jsonb AS label_name, NULL AS label_code FROM programme_modules pm
        WHERE pm.code = ?
        UNION ALL
        SELECT pm.*, c.order AS module_order, c.name AS label_name, c.code AS label_code
        FROM children c, programme_modules pm, programme_module_children pmc
        WHERE c.id = pmc.parent_id AND pm.id = pmc.child_id
        GROUP BY pm.id, c.name, c.code, c.order
      ) SELECT * FROM children WHERE type = ?`,
      { replacements: [code, type] }
    )
    return result
  } catch (e) {
    logger.error(`Error when searching modules and children with code: ${code}`)
    return []
  }
}

const byProgrammeCode = async code => {
  const result = await recursivelyGetModuleAndChildren(code, 'course')
  if (!result.length) return []
  const excluded = await ExcludedCourse.findAll({
    where: {
      programme_code: {
        [Op.eq]: code,
      },
    },
  })

  // filter out possible duplicates
  const filtered = result.filter(
    (course, index, array) =>
      array.findIndex(c => c.id == course.id && c.code == course.code && c.label_code == course.label_code) == index
  )

  // this labels the modules to match the old system in frontend
  const labeled = filtered.map(module => {
    const label = {
      id: module.label_name.fi,
      label: `${module.label_code}\n${module.label_name.fi}`,
      orderNumber: module.module_order,
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
const modulesByProgrammeCode = async code => {
  return await recursivelyGetModuleAndChildren(code, 'module')
}

const removeExcludedCourses = async ids => {
  return ExcludedCourse.destroy({
    where: {
      id: {
        [Op.or]: ids,
      },
    },
  })
}

module.exports = { byProgrammeCode, addExcludedCourses, removeExcludedCourses, modulesByProgrammeCode }
