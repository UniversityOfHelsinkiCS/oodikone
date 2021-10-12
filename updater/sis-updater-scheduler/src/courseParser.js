const { knexConnection } = require('./db/connection')

let superFlatten = false

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
  const { knex } = knexConnection
  const id = rule.moduleGroupId

  const mod = await knex('modules').where({ group_id: id }).orderBy('curriculum_period_ids', 'desc').first()

  if (mod.type == 'StudyModule') {
    const result = await resolver(mod.rule, n)
    if (mod.code.slice(0, 3) === 'KK-') return null
    const moduleCourses = { module: { id: mod.group_id, code: mod.code, name: mod.name.fi }, children: result }
    return moduleCourses
  }

  if (mod.type == 'GroupingModule') {
    const module = await moduleRuleResolver(mod, n)
    if (superFlatten) return customFlatten(module)
    return { module: { id: mod.group_id, code: mod.code, name: mod.name.fi }, children: module }
  }

  return {
    name: mod.name.fi,
    type: mod.type,
    result: 'unhandled module type: ' + mod.type,
  }
}

async function compositeResolver(rule, n) {
  const result = await Promise.all(rule.rules.map(r => resolver(r, n + 1)))
  return customFlatten(result.filter(Boolean))
}

async function courseResolver(rule) {
  const { knex } = knexConnection

  const id = rule.courseUnitGroupId
  const course = await knex('course_units').where({ group_id: id }).first()
  if (!course) {
    return { error: 'course not found' }
  }

  return {
    id: course.group_id,
    code: course.code,
    name: course.name ? course.name.fi : '',
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

const getCourses = async (code, doSuperFlatten) => {
  superFlatten = doSuperFlatten
  const { knex } = knexConnection

  const result = await knex('modules').where({ code: code }).first()

  const id = result.group_id
  const name = result.name.fi

  const data = await resolver(result.rule, 1)
  const appeared = new Set()

  const filtered = data.filter(d => {
    if (!d.module) return false
    if (appeared.has(d.module.id)) {
      return false
    }
    appeared.add(d.module.id)
    return true
  })
  const flattened = { module: { id, name }, children: filtered }

  return flattened
}

module.exports = { getCourses }
