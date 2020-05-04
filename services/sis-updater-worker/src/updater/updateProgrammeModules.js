const { selectFromByIds } = require('../db')
const { ProgrammeModule, ProgrammeModuleChild } = require('../db/models')

const { dbConnections } = require('../db/connection')

let superFlatten = true

function customFlatten(arr) {
  let result = []

  for (let elem of arr) {
    if (!Array.isArray(elem) || (!elem[0].module && elem[0].code)) {
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
        children: data
      }
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

  const mod = await knex('modules')
    .where({ group_id: id })
    .orderBy('curriculum_period_ids', 'desc')
    .first()

  if (mod.type == 'StudyModule') {
    const result = await resolver(mod.rule, n)
    if (mod.code.slice(0, 3) === 'KK-') return null
    const moduleCourses = { id: mod.group_id, code: mod.code, name: mod.name, type: 'module', children: result }
    return moduleCourses
  }

  if (mod.type == 'GroupingModule') {
    const module = await moduleRuleResolver(mod, n)
    if (superFlatten) return customFlatten(module)
    return { id: mod.group_id, code: mod.code, name: mod.name, type: 'module', children: module }
  }

  return {
    name: mod.name,
    type: 'unknown'
  }
}

async function compositeResolver(rule, n) {
  const result = await Promise.all(rule.rules.map(r => resolver(r, n + 1)))
  return customFlatten(result.filter(Boolean))
}

async function courseResolver(rule) {
  const { knex } = dbConnections

  const id = rule.courseUnitGroupId
  const course = await knex('course_units')
    .where({ group_id: id })
    .first()

  return {
    id: course.group_id,
    code: course.code,
    name: course.name,
    type: 'course'
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
    fact: 'Unhandled rule'
  }
}

const recursiveWrite = async (module, parentId) => {
  if (!module.id) return
  await ProgrammeModule.findOrCreate({
    where: { id: module.id },
    defaults: {
      id: module.id,
      code: module.code,
      name: module.name,
      type: module.type
    }
  })

  await new ProgrammeModuleChild({
    parent_id: parentId,
    child_id: module.id
  }).save()

  if (!module.children) return
  for (const child of module.children) {
    recursiveWrite(child, module.id)
  }
}

const updateProgrammeModules = async (entityIds = []) => {
  await ProgrammeModule.destroy({ where: {}, truncate: true, cascade: true })
  const topModules = await selectFromByIds('modules', entityIds)

  topModules.forEach(async module => {
    console.log('STARTING TO WRITE', module)
    await new ProgrammeModule({
      id: module.group_id,
      code: module.code,
      name: module.name,
      type: 'module'
    }).save()
    const submodule = await resolver(module.rule)
    submodule.forEach(submod => recursiveWrite(submod, module.group_id))
  })
}

module.exports = { updateProgrammeModules }
