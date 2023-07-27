const anyModule = rule => ({ id: rule.localId, name: 'Any module' })
const anyCourse = rule => ({ id: rule.localId, name: 'Any course' })
const unknownRule = rule => ({ type: rule.type, fact: 'Unhandled rule' })
const unknownModule = mod => ({ name: mod.name, type: 'unknown' })

class ModuleResolver {
  constructor(knex) {
    this.knex = knex
    this.moduleCache = {}
    this.order = 1
  }

  createModule = (mod, children) => {
    if (!mod.id) return children
    const newMod = {
      id: mod.id,
      group_id: mod.group_id,
      code: mod.code,
      name: mod.name,
      type: 'module',
      study_level: mod.study_level,
      valid_from: mod?.validity_period?.startDate ?? null,
      valid_to: mod?.validity_period?.endDate ?? null,
      order: this.order++,
      children,
    }
    return newMod
  }

  resolveSingleModule = async mod => {
    if (mod.type === 'StudyModule') {
      const children = await this.resolve(mod.rule)
      if (mod.code.startsWith('KK-')) return null
      return this.createModule(mod, children)
    }

    if (mod.type === 'GroupingModule') {
      const children = await this.resolve(mod.rule)
      return this.createModule(mod, children)
    }

    return unknownModule(mod)
  }

  moduleResolver = async rule => {
    const id = rule.moduleGroupId

    const modules = await this.knex('modules').where({ group_id: id })
    const children = []

    for (let mod of modules) {
      let result = this.moduleCache[mod.id]
      if (!result) {
        result = await this.resolveSingleModule(mod)
        this.moduleCache[mod.id] = result
      }
      children.push(result)
    }
    return children
  }

  compositeResolver = async rule => {
    const children = []
    for (const r of rule.rules) {
      const result = await this.resolve(r)
      children.push(result)
    }
    return children.filter(Boolean)
  }

  courseResolver = async rule => {
    const courseGroupId = rule.courseUnitGroupId
    const courses = await this.knex('course_units').where({ group_id: courseGroupId })

    if (!courses) {
      return { error: 'could not find course' }
    }
    return courses.map(course => ({
      id: course.id,
      group_id: course.group_id,
      code: course.code,
      name: course.name,
      study_level: course.study_level,
      type: 'course',
      valid_from: course.validity_period.startDate ?? null,
      valid_to: course.validity_period.endDate ?? null,
      order: this.order++,
    }))
  }

  resolve = async rule => {
    if (rule.type === 'CreditsRule') {
      return await this.resolve(rule.rule)
    }
    if (rule.type === 'CompositeRule') {
      return await this.compositeResolver(rule)
    }
    if (rule.type === 'ModuleRule') {
      return await this.moduleResolver(rule)
    }
    if (rule.type === 'CourseUnitRule') {
      return await this.courseResolver(rule)
    }

    if (rule.type === 'AnyCourseUnitRule') {
      return anyCourse(rule)
    }

    if (rule.type === 'AnyModuleRule') {
      return anyModule(rule)
    }

    return unknownRule(rule)
  }
}

module.exports = ModuleResolver
