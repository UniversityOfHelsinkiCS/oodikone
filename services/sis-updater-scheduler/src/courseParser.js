const { flatten } = require('lodash')
const { knexConnection } = require('./db/connection')

async function creditResolver(rule, n) {
  const data = await resolver(rule.rule, n + 1)
  if (rule.credits.min === 45) {
    console.log(rule, data)
  }
  if (rule.credits.min < 100 && rule.credits.min > 0) {
    return [
      {
        credits: rule.credits.min,
        modules: data
      }
    ]
  }

  return data
}

async function moduleRuleResolver(mod, n) {
  const result = await resolver(mod.rule, n + 1)
  return flatten(result)
}

async function moduleResolver(rule, n) {
  const { knex } = knexConnection
  const id = rule.moduleGroupId

  const mod = await knex('modules')
    .where({ group_id: id })
    .orderBy('curriculum_period_ids', 'desc')
    .first()

  if (mod.type == 'StudyModule') {
    const result = await resolver(mod.rule, n)
    if (mod.code === 'MAT230') console.log(mod.rule, result)
    if (mod.code.slice(0, 3) === 'KK-') return null
    const moduleCourses = { module: { id: mod.group_id, code: mod.code, name: mod.name.fi }, courses: result }
    return moduleCourses
  }

  if (mod.type == 'GroupingModule') {
    return moduleRuleResolver(mod, n)
  }

  return {
    name: mod.name.fi,
    type: mod.type,
    result: 'unhandled module type: ' + mod.type
  }
}

async function compositeResolver(rule, n) {
  const result = await Promise.all(rule.rules.map(r => resolver(r, n + 1)))
  return flatten(result.filter(Boolean))
}

async function courseResolver(rule) {
  const { knex } = knexConnection

  const id = rule.courseUnitGroupId
  const course = await knex('course_units')
    .where({ group_id: id })
    .first()

  return {
    id: course.group_id,
    code: course.code,
    name: course.name ? course.name.fi : ''
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
    console.log(rule)
    return { id: rule.localId, name: 'Any module' }
  }

  return {
    type: rule.type,
    fact: 'Unhandled rule'
  }
}

const getCourses = async code => {
  const { knex } = knexConnection

  const result = await knex('modules')
    .where({ code: code })
    .first()

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

  return {
    id,
    name,
    modules: filtered
  }
}

module.exports = { getCourses }
