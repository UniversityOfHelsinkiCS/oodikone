const { knexConnection } = require('./db/connection')

let seen = []

function flatten(arr) {
  const result = []
  for (let elem of arr) {
    if (!Array.isArray(elem)) {
      result.push(elem)
      continue
    }

    for (let subelem of elem) {
      result.push(subelem)
    }
  }

  return result
}

async function moduleRuleResolver(mod, n) {
  if (mod.rule.rules) {
    return compositeResolver(mod.rule, n + 1)
  }

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
    const result = await moduleRuleResolver(mod, n)
    const moduleCourses = { module: { id: mod.group_id, code: mod.code }, courses: result }
    return moduleCourses
  }

  if (mod.type == 'GroupingModule') {
    if (mod.rule.rules) {
      return Promise.all(mod.rule.rules.map(r => resolver(r, n + 1)))
    }

    return resolver(mod.rule, n + 1)
  }

  return {
    name: mod.name.fi,
    type: mod.type,
    result: 'unhandled module type: ' + mod.type
  }
}

async function compositeResolver(rule, n) {
  const result = await Promise.all(rule.rules.map(r => resolver(r, n + 1)))
  return flatten(result)
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
  const lid = rule.localId

  seen.push(lid)

  if (n > 24) {
    return 'Max depth reached'
  } else if (!n) {
    return '***'
  }

  if (rule.type == 'CreditsRule') {
    return resolver(rule.rule, n + 1)
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

  const id = result.groupId
  const name = result.name.fi

  // find the acual studies
  let mod = result.rule.rule.rules[0]

  while (mod.type != 'ModuleRule') {
    mod = mod.rules[0]
  }

  const data = await resolver(mod, 1) // works well with TKT

  return {
    id,
    name,
    modules: data
  }
}

module.exports = { getCourses }
