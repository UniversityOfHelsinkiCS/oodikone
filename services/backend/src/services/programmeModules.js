const Sequelize = require('sequelize')
const { ExcludedCourse } = require('../models/models_kone')
const { Op } = Sequelize
const logger = require('../util/logger')
const { combinedStudyprogrammes } = require('./studyprogrammeHelpers.js')
const { dbConnections } = require('../database/connection')

const recursivelyGetModuleAndChildren = async (code, type, start = '1900-1-1', end = '2100-1-1') => {
  const connection = dbConnections.sequelize
  try {
    const [result] = await connection.query(
      `WITH RECURSIVE children as (
        SELECT DISTINCT pm.*, 0 AS module_order, NULL::jsonb AS parent_name, NULL AS parent_code, NULL as parent_id FROM programme_modules pm
        WHERE pm.code = ?
        UNION ALL
        SELECT pm.*, c.order AS module_order, c.name AS parent_name, c.code AS parent_code, c.id as parent_id
        FROM children c, programme_modules pm, programme_module_children pmc
        WHERE c.id = pmc.parent_id AND pm.group_id = pmc.child_id
        GROUP BY pm.id, c.name, c.code, c.order, c.id
      ) SELECT * FROM children WHERE type = ? AND (valid_to > ? OR valid_to IS NULL) AND (valid_from < ? OR valid_from IS NULL)`,
      { replacements: [code, type, start, end] }
    )
    return result
  } catch (e) {
    logger.error(`Error when searching modules and children with code: ${code}`)
    return []
  }
}

const modifyParent = (course, moduleMap) => {
  let parent = moduleMap[course.parent_id]
  const parents = []
  while (parent) {
    parents.push(parent)
    parent = moduleMap[parent.parent_id]
  }

  let skip = 0
  const parentsWithCode = parents.filter(p => p.code)
  if (parentsWithCode.length > 0) {
    parent = parentsWithCode[skip >= parentsWithCode.length ? parentsWithCode.length - 1 : skip]
  } else {
    parent = parents.find(m => m.code)
  }
  return { ...course, parent_id: parent.id, parent_code: parent.code, parent_name: parent.name }
}

const getCoursesAndModulesForProgramme = async code => {
  const courses = await recursivelyGetModuleAndChildren(code, 'course')
  const modules = await recursivelyGetModuleAndChildren(code, 'module')
  const excludedCourses = await ExcludedCourse.findAll({
    where: {
      programme_code: {
        [Op.eq]: code,
      },
    },
  })
  const modulesMap = modules.reduce((obj, cur) => ({ ...obj, [cur.id]: cur }), {})
  const modifiedCourses = courses
    .map(c => modifyParent(c, modulesMap, code))
    .filter(
      (course1, index, array) =>
        array.findIndex(course2 => course1.code === course2.code && course1.parent_code === course2.parent_code) ===
        index
    )

  return { courses: labelProgammes(modifiedCourses, excludedCourses), modules }
}

const getCoursesAndModules = async code => {
  const defaultProgrammeCourses = await getCoursesAndModulesForProgramme(code)
  if (Object.keys(combinedStudyprogrammes).includes(code)) {
    const secondProgramme = combinedStudyprogrammes[code]
    const secondProgrammeCourses = await getCoursesAndModulesForProgramme(secondProgramme)
    return { defaultProgrammeCourses, secondProgrammeCourses }
  }
  return { defaultProgrammeCourses, secondProgrammeCourses: { courses: [], modules: [] } }
}

const labelProgammes = (modules, excludedCourses) => {
  return modules.map(module => {
    const label = {
      id: module.parent_name.fi,
      label: `${module.parent_code}\n${module.parent_name.fi}`,
      orderNumber: module.module_order,
    }
    const foundCourse = excludedCourses.find(course => course.course_code === module.code)
    const visible = { visibility: !foundCourse, id: foundCourse?.id ?? null }
    return { ...module, label, visible }
  })
}

module.exports = getCoursesAndModules
