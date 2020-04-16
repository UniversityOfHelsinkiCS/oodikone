const { knexConnection } = require('./db/connection')

let seen = []

async function moduleRuleResolver(mod, n) {
  if (mod.rule.rules) {
    return compositeResolver(mod.rule, n + 1)
  }

  const result = await resolver(mod.rule, n + 1)
  return [result]
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
    const moduleCourses = { module: { id: mod.id, code: mod.code }, courses: result }
    return moduleCourses
  }

  if (mod.type == 'GroupingModule') {
    const result = await moduleRuleResolver(mod, n)
    return result
  }

  return {
    name: mod.name.fi,
    type: mod.type,
    result: 'unhandled module type: ' + mod.type
  }
}

async function compositeResolver(rule, n) {
  return Promise.all(rule.rules.map(r => resolver(r, n + 1)))
}

async function courseResolver(rule) {
  const { knex } = knexConnection

  const id = rule.courseUnitGroupId
  const course = await knex('course_units')
    .where({ group_id: id })
    .first()

  return {
    name: course.name ? course.name.fi : '',
    code: course.code
  }
}

async function resolver(rule, n) {
  const lid = rule.localId

  if (seen.includes(lid)) {
    return {
      type: rule.type,
      lid,
      groupId: rule.moduleGroupId,
      message: 'Circular reference to rule'
    }
  }

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

  const data = await resolver(result.rule.rule.rules[0], 1) // works well with TKT

  return {
    id,
    name,
    modules: data
  }
}

module.exports = { getCourses }
