const { chunk } = require('lodash')

const { bulkCreate, selectFromByIds } = require('../../db')
const { dbConnections } = require('../../db/connection')
const { ProgrammeModule, ProgrammeModuleChild } = require('../../db/models')
const ModuleResolver = require('./resolver')

const resolveProgramme = async programme => {
  const responsibleOrg = programme.organisations
    ? programme.organisations.find(o => o.roleUrn === 'urn:code:organisation-role:responsible-organisation')
    : null

  const resolver = new ModuleResolver(dbConnections.knex)

  const children = await resolver.resolve(programme.rule)

  return {
    id: programme.id,
    group_id: programme.group_id,
    code: programme.code,
    name: programme.name,
    type: 'module',
    studyLevel: programme.study_level,
    organization_id: responsibleOrg?.organisationId ?? null,
    valid_from: programme?.validity_period?.startDate ?? null,
    valid_to: programme?.validity_period?.endDate ?? null,
    curriculum_period_ids: programme.curriculum_period_ids ?? [],
    degreeProgramTypeUrn: programme.degree_program_type_urn,
    order: 0,
    degree_programme_type_urn: programme.degree_programme_type_urn,
    children,
  }
}

const recursiveWrite = (modArg, parentId, programmeMap, joinMap) => {
  const mod = (!modArg.type || !modArg.id) && !Array.isArray(modArg) && modArg.children ? modArg.children : modArg

  if (Array.isArray(mod)) {
    mod.filter(Boolean).forEach(m => recursiveWrite(m, parentId, programmeMap, joinMap))
    return
  }

  if (!mod.id || !mod.group_id) {
    return
  }

  const join = {
    composite: `${parentId}-${mod.group_id}`,
    parentId,
    childId: mod.group_id,
  }

  const { children, ...newModule } = mod

  programmeMap[mod.id] = newModule

  if (parentId) joinMap[join.composite] = join

  if (!children) return
  children.forEach(child => recursiveWrite(child, mod.id, programmeMap, joinMap))
}

const updateProgrammeModulesChunk = async programmeIds => {
  const moduleMap = {}
  const joinMap = {}
  const programmes = await selectFromByIds('modules', programmeIds)

  for (const programme of programmes) {
    const resolvedProgramme = await resolveProgramme(programme)
    recursiveWrite(resolvedProgramme, null, moduleMap, joinMap)
  }

  await bulkCreate(ProgrammeModule, Object.values(moduleMap))
  await ProgrammeModuleChild.bulkCreate(Object.values(joinMap), { ignoreDuplicates: true })
}

const updateProgrammeModules = async programmeIds => {
  await ProgrammeModuleChild.destroy({ where: {} })
  await ProgrammeModule.destroy({ where: {} })
  const programmeChunks = chunk(programmeIds, 25)
  for (const chunk of programmeChunks) {
    await updateProgrammeModulesChunk(chunk)
  }
}

module.exports = { updateProgrammeModules }
