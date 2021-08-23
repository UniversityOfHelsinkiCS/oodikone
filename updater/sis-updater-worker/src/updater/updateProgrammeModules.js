const { selectFromByIds, bulkCreate } = require('../db')
const { ProgrammeModule, ProgrammeModuleChild } = require('../db/models')

const { dbConnections } = require('../db/connection')

let superFlatten = true

function customFlatten(arr) {
  let result = []

  for (let elem of arr) {
    if (!Array.isArray(elem) || elem.length === 0 || (!elem[0].module && elem[0].code)) {
      if (!superFlatten && elem.module && elem.children.length === 1) {
        result.push(elem.children[0])
        continue
      }
      result.push(elem)
      continue
    }

    for (let subelem of elem) {
      result.push(subelem)
    }
  }

  return result
}

async function creditResolver(rule, n) {
  const data = await resolver(rule.rule, n + 1)
  if (!superFlatten && rule.credits.min < 100 && rule.credits.min > 0) {
    return [
      {
        credits: rule.credits.min,
        children: data,
      },
    ]
  }

  return data
}

async function moduleRuleResolver(mod, n) {
  const result = await resolver(mod.rule, n + 1)
  return customFlatten(result)
}

async function moduleResolver(rule, n) {
  const { knex } = dbConnections
  const id = rule.moduleGroupId

  const mod = await knex('modules').where({ group_id: id }).orderBy('curriculum_period_ids', 'desc').first()

  if (!mod) {
    return { error: 'Could not find module' }
  }

  if (mod.type == 'StudyModule') {
    const result = await resolver(mod.rule, n)
    if (mod.code.slice(0, 3) === 'KK-') return null
    const moduleCourses = {
      id: mod.group_id,
      code: mod.code,
      name: mod.name,
      type: 'module',
      study_level: mod.study_level,
      children: result,
    }
    return moduleCourses
  }

  if (mod.type == 'GroupingModule') {
    const module = await moduleRuleResolver(mod, n)
    if (superFlatten) return customFlatten(module)
    return {
      id: mod.group_id,
      code: mod.code,
      name: mod.name,
      type: 'module',
      study_level: mod.study_level,
      children: module,
    }
  }

  return {
    name: mod.name,
    type: 'unknown',
  }
}

async function compositeResolver(rule, n) {
  const result = await Promise.all(rule.rules.map(r => resolver(r, n + 1)))
  return customFlatten(result.filter(Boolean))
}

async function courseResolver(rule) {
  const { knex } = dbConnections

  const id = rule.courseUnitGroupId
  const course = await knex('course_units').where({ group_id: id }).first()

  if (!course) {
    return { error: 'could not find course' }
  }

  return {
    id: course.group_id,
    code: course.code,
    name: course.name,
    study_level: course.study_level,
    type: 'course',
  }
}

async function resolver(rule, n) {
  if (rule.type == 'CreditsRule') {
    return creditResolver(rule, n + 1)
  }
  if (rule.type == 'CompositeRule') {
    return compositeResolver(rule, n)
  }
  if (rule.type == 'ModuleRule') {
    return moduleResolver(rule, n)
  }
  if (rule.type == 'CourseUnitRule') {
    return courseResolver(rule)
  }

  if (rule.type == 'AnyCourseUnitRule') {
    return { id: rule.localId, name: 'Any course' }
  }

  if (rule.type == 'AnyModuleRule') {
    return { id: rule.localId, name: 'Any module' }
  }

  return {
    type: rule.type,
    fact: 'Unhandled rule',
  }
}

let programmes = {}
let joins = {}

const recursiveWrite = async (module, parentId) => {
  if (Array.isArray(module)) {
    module.forEach(m => recursiveWrite(m, parentId))
  }
  if (!module.id || !module.type) return
  const newModule = {
    id: module.id,
    code: module.code,
    name: module.name,
    type: module.type,
    studyLevel: module.study_level,
  }
  if (module.type !== 'course') {
    console.log('new module', newModule)
    console.log('new modules orig details', module)
  }

  let join = {
    composite: `${parentId}-${module.id}`,
    parentId: parentId,
    childId: module.id,
  }

  programmes[module.id] = newModule
  joins[join.composite] = join

  if (!module.children) return
  for (const child of module.children) {
    let childOrder = 0
    await recursiveWrite(child, module.id, childOrder++)
  }
}

const updateProgrammeModules = async (entityIds = []) => {
  programmes = {}
  joins = {}

  const topModules = await selectFromByIds('modules', entityIds)

  for (const module of topModules) {
    const topModule = {
      id: module.group_id,
      code: module.code,
      name: module.name,
      type: 'module',
      studyLevel: module.study_level,
    }
    programmes[module.group_id] = topModule
    const submodule = await resolver(module.rule)
    for (const submod of submodule) {
      recursiveWrite(submod, module.group_id)
    }
  }

  let order = 0
  for (let key in programmes) {
    programmes[key].order = order++
  }

  await bulkCreate(ProgrammeModule, Object.values(programmes))
  for (const join of Object.values(joins)) {
    await ProgrammeModuleChild.upsert(join)
  }
}

module.exports = { updateProgrammeModules }
