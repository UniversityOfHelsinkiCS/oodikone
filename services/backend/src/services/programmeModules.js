const Sequelize = require('sequelize')
const { ExcludedCourse } = require('../models/models_kone')
const { Op } = Sequelize
const logger = require('../util/logger')
const { combinedStudyprogrammes } = require('./studyprogrammeHelpers.js')
const { dbConnections } = require('../database/connection')
const { ProgrammeModule } = require('../models')

const getCurriculumVersions = async code => {
  try {
    const result = await ProgrammeModule.findAll({ where: { code } })
    if (!result) return
    const modified = result.map(r => ({
      ...r,
      curriculum_period_ids: r.curriculum_period_ids.map(id => parseInt(id.substring(6)) + 1949),
    }))
    return modified
  } catch (e) {
    logger.error(`Error when searching curriculum versions for code: ${code}`)
    logger.error(e)
    return null
  }
}

const recursivelyGetModuleAndChildren = async (code, curriculum_period_ids) => {
  const connection = dbConnections.sequelize
  try {
    const [result] = await connection.query(
      `WITH RECURSIVE children as (
        SELECT DISTINCT pm.*, 0 AS module_order, NULL::jsonb AS parent_name, NULL AS parent_code, NULL as parent_id FROM programme_modules pm
        WHERE pm.code = ? AND ARRAY[?]::text[] && curriculum_period_ids
        UNION ALL
        SELECT pm.*, c.order AS module_order, c.name AS parent_name, c.code AS parent_code, c.id as parent_id
        FROM children c, programme_modules pm, programme_module_children pmc
        WHERE c.id = pmc.parent_id AND pm.group_id = pmc.child_id AND (ARRAY[?]::text[] && pm.curriculum_period_ids OR pm.type = 'course' OR pm.code is null)
        GROUP BY pm.id, c.name, c.code, c.order, c.id
      ) SELECT * FROM children`,
      { replacements: [code, curriculum_period_ids, curriculum_period_ids] }
    )
    return result
  } catch (e) {
    logger.error(`Error when searching modules and children with code: ${code}`)
    logger.error(e)
    return null
  }
}

const modifyParent = (course, moduleMap) => {
  let parent = moduleMap[course.parent_id]
  const parents = []
  while (parent) {
    parents.push(parent)
    parent = moduleMap[parent.parent_id]
  }

  const skip = 0
  const parentsWithCode = parents.filter(p => p.code)
  if (parentsWithCode.length > 0) {
    parent = parentsWithCode[skip >= parentsWithCode.length ? parentsWithCode.length - 1 : skip]
  } else {
    parent = parents.find(m => m.code)
  }
  if (!parent) {
    return { faulty: true }
  }
  return { ...course, parent_id: parent.id, parent_code: parent.code, parent_name: parent.name }
}

const getCoursesAndModulesForProgramme = async (code, period_ids) => {
  if (!period_ids) return {}
  const result = await recursivelyGetModuleAndChildren(
    code,
    period_ids.map(id => `hy-lv-${id - 1949}`)
  )
  const courses = result.filter(r => r.type === 'course')
  const modules = result.filter(r => r.type === 'module')
  const excludedCourses = await ExcludedCourse.findAll({
    where: {
      programme_code: {
        [Op.eq]: code,
      },
      curriculum_version: {
        [Op.eq]: period_ids.join(','),
      },
    },
  })
  const modulesMap = modules.reduce((obj, cur) => ({ ...obj, [cur.id]: cur }), {})
  const modifiedCourses = courses
    .map(c => modifyParent(c, modulesMap, code))
    .filter(c => !c.faulty)
    .filter(
      (course1, index, array) =>
        array.findIndex(course2 => course1.code === course2.code && course1.parent_code === course2.parent_code) ===
        index
    )

  return { courses: labelProgammes(modifiedCourses, excludedCourses), modules }
}

const getCoursesAndModules = async (code, period_ids) => {
  const defaultProgrammeCourses = await getCoursesAndModulesForProgramme(code, period_ids)
  if (Object.keys(combinedStudyprogrammes).includes(code)) {
    const secondProgramme = combinedStudyprogrammes[code]
    const secondProgrammeCourses = await getCoursesAndModulesForProgramme(secondProgramme, period_ids)
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

module.exports = { getCoursesAndModules, getCurriculumVersions }
