const { knexConnection } = require('./db/connection')

let seen = null
const includeRules = false

async function creditResolver(rule, n) {
  const data = await resolver(rule.rule, n + 1)
  return {
    credits: rule.credits,
    data: data,
  }
}

async function moduleRuleResolver(mod, n) {
  if (mod.rule.rules) {
    const result = Promise.all(mod.rule.rules.map(rule => resolver(rule, n + 1)))
    return result
  }

  const result = await resolver(mod.rule, n + 1)
  return [result]
}

async function moduleResolver(rule, n) {
  const { knex } = knexConnection
  const id = rule.moduleGroupId

  const mod = await knex('modules').where({ group_id: id }).orderBy('curriculum_period_ids', 'desc').first()

  if (mod.type == 'StudyModule') {
    const result = await moduleRuleResolver(mod, n)
    return {
      id: mod.id,
      name: mod.name.fi,
      studyLevel: mod.studyLevel,
      targetCredits: mod.targetCredits,
      code: mod.code,
      type: mod.type,
      result,
    }
  }

  if (mod.type == 'GroupingModule') {
    const result = await moduleRuleResolver(mod, n)
    return {
      id: mod.id,
      name: mod.name.fi,
      type: mod.type,
      result,
      allMandatory: mod.type.allMandatory,
    }
  }

  return {
    id: mod.id,
    name: mod.name.fi,
    type: mod.type,
    result: 'unhandled module type: ' + mod.type,
  }
}

async function compositeResolver(rule, n) {
  const result = await Promise.all(rule.rules.map(r => resolver(r, n + 1)))

  if (includeRules) {
    return {
      data: result,
      rule,
    }
  }

  return result
}

async function courseResolver(rule) {
  const { knex } = knexConnection

  const id = rule.courseUnitGroupId
  const course = await knex('course_units').where({ group_id: id }).first()

  return {
    id: course.id,
    name: course.name ? course.name.fi : '',
    code: course.code,
  }
}

async function resolver(rule, n) {
  const lid = rule.localId

  // if (seen.includes(lid)) {
  //   return {
  //     type: rule.type,
  //     lid,
  //     groupId: rule.moduleGroupId,
  //     message: 'Circular reference to rule'
  //   }
  // }
  seen.push(lid)

  if (n > 24) {
    return 'Max depth reached'
  } else if (!n) {
    return '***'
  }

  if (rule.type == 'CreditsRule') {
    const data = await creditResolver(rule, n)
    return {
      type: rule.type,
      data,
      rule: includeRules ? rule : null,
    }
  }
  if (rule.type == 'CompositeRule') {
    const data = await compositeResolver(rule, n)
    return {
      type: rule.type,
      allMandatory: rule.allMandatory,
      data,
      rule: includeRules ? rule : null,
    }
  }
  if (rule.type == 'ModuleRule') {
    const data = await moduleResolver(rule, n)

    return {
      type: rule.type,
      data,
    }
  }
  if (rule.type == 'CourseUnitRule') {
    const data = await courseResolver(rule)
    return {
      type: rule.type,
      data,
    }
  }

  return {
    type: rule.type,
    fact: 'Unhandled rule',
  }
}

const getStructure = async code => {
  const { knex } = knexConnection

  seen = []
  const result = await knex('modules').where({ code: code }).first()

  const id = result.groupId
  const type = result.type
  const name = result.name.fi

  const data = await resolver(result.rule, 1)

  return {
    id,
    type,
    name,
    data,
  }
}

module.exports = { getStructure }
