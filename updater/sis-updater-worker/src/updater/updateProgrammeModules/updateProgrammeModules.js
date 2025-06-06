import { chunk } from 'lodash-es'

import { dbConnections } from '../../db/connection.js'
import { bulkCreate, selectFromByIds } from '../../db/index.js'
import { ProgrammeModule, ProgrammeModuleChild } from '../../db/models/index.js'
import logger from '../../utils/logger.js'
import { ModuleResolver } from './resolver.js'

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
    order: 0,
    degreeProgrammeType: programme?.degree_program_type_urn ?? null,
    minimumCredits: programme?.degree_program_type_urn ? programme.target_credits.min : null,
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

  // the "children" variable might contain the result of resolving, e.g., AnyCourseUnitRule, in which case
  // it is one single object, and the function should return, hence checking that it is an array below
  if (!children || !Array.isArray(children)) return
  try {
    children.forEach(child => recursiveWrite(child, mod.id, programmeMap, joinMap))
  } catch (error) {
    logger.error(
      `Could not update programme module with id ${mod.id} and parentId ${parentId} due to faulty children/rule handling`,
      error
    )
  }
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
  await bulkCreate(ProgrammeModuleChild, Object.values(joinMap), null, [], false, 'composite')
}

export const updateProgrammeModules = async programmeIds => {
  await ProgrammeModuleChild.destroy({ where: {} })
  await ProgrammeModule.destroy({ where: {} })
  const programmeChunks = chunk(programmeIds, 25)
  for (const chunk of programmeChunks) {
    await updateProgrammeModulesChunk(chunk)
  }
}
