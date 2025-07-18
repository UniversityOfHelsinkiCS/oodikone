import { groupBy, orderBy } from 'lodash'
import { QueryTypes } from 'sequelize'

import { ProgrammeModuleWithRelevantAttributes } from '@oodikone/shared/types'
import { serviceProvider } from '../../config'
import { programmeCodes } from '../../config/programmeCodes'
import { dbConnections } from '../../database/connection'
import { OrganizationModel } from '../../models'
import { CurriculumPeriods, getCurriculumPeriods } from '../curriculumPeriods'

const { sequelize } = dbConnections

const mapCurriculumPeriodIdToYear = (curriculumPeriodId: string, curriculumPeriods: CurriculumPeriods) => {
  const curriculumPeriod = curriculumPeriods[curriculumPeriodId]

  if (curriculumPeriod) {
    return { startDate: curriculumPeriod.startDate, endDate: curriculumPeriod.endDate }
  }
  // Returns impossible default if there is not curriculumPeriods for some reason
  return { startDate: new Date('1800-08-01'), endDate: new Date('1801-08-01') }
}

// Some programme modules are not directly associated to a faculty (organization).
// Some have intermediate organizations, such as department, so the connection must be digged up
export const getDegreeProgrammesOfOrganization = async (organizationId: string, onlyCurrentProgrammes: boolean) => {
  const programmesOfOrganization: Array<Omit<ProgrammeModuleWithRelevantAttributes, 'progId'> & { validFrom: Date }> =
    await sequelize.query(
      `
      SELECT 
        code,
        curriculum_period_ids as "curriculumPeriodIds",
        degree_programme_type as "degreeProgrammeType",
        name,
        valid_from as "validFrom"
      FROM programme_modules
      WHERE organization_id IN (
        WITH RECURSIVE cte AS (
          SELECT id, parent_id
          FROM organization
          WHERE parent_id = :organizationId OR id = :organizationId
          UNION ALL
          SELECT o.id, o.parent_id
          FROM organization o
          INNER JOIN cte ON o.parent_id = cte.id
        )
        SELECT DISTINCT(id) FROM cte
      )
      ORDER BY code
    `,
      {
        type: QueryTypes.SELECT,
        replacements: { organizationId },
      }
    )
  const programmesWithProgIds = programmesOfOrganization.map(programme => ({
    ...programme,
    progId:
      programme.code in programmeCodes && serviceProvider !== 'fd'
        ? programmeCodes[programme.code as keyof typeof programmeCodes]
        : programme.code,
  }))
  const programmesGroupedByCode = groupBy(orderBy(programmesWithProgIds, ['valid_from'], ['desc']), prog => prog.code)
  const curriculumPeriods = await getCurriculumPeriods()
  const relevantProgrammes: ProgrammeModuleWithRelevantAttributes[] = []

  for (const programmeVersions of Object.values(programmesGroupedByCode)) {
    // Programmes are ordered by valid_from in descending order, so the first one whose valid_from date isn't in the future, is the newest version
    const newestProgrammeVersion = programmeVersions.find(prog => new Date() >= prog.validFrom)
    if (!newestProgrammeVersion) {
      continue
    }
    const { code, name, degreeProgrammeType, progId } = newestProgrammeVersion

    const yearsOfProgramme = programmeVersions
      .map(prog =>
        prog.curriculumPeriodIds.map(curriculumPeriodId => {
          return mapCurriculumPeriodIdToYear(curriculumPeriodId, curriculumPeriods)
        })
      )
      .flat()
    const isRelevantProgramme =
      !onlyCurrentProgrammes ||
      (onlyCurrentProgrammes &&
        yearsOfProgramme.some(year => year.startDate <= new Date() && new Date() <= year.endDate))

    if (isRelevantProgramme) {
      relevantProgrammes.push({
        code,
        curriculumPeriodIds: programmeVersions.map(prog => prog.curriculumPeriodIds).flat(),
        degreeProgrammeType,
        name,
        progId,
      })
    }
  }
  return relevantProgrammes
}

export type ProgrammesOfOrganization = ProgrammeModuleWithRelevantAttributes[]

export const getDegreeProgrammesOfFaculty = async (facultyCode: string, onlyCurrentProgrammes: boolean) => {
  const organization = await OrganizationModel.findOne({
    attributes: ['id'],
    where: {
      code: facultyCode,
    },
  })
  if (!organization) {
    throw new Error(`The organization with the code ${facultyCode} was not found.`)
  }
  return getDegreeProgrammesOfOrganization(organization.id, onlyCurrentProgrammes)
}

export const getFacultyCodeById = async (facultyId: string) => {
  const organization = await OrganizationModel.findOne({
    attributes: ['code'],
    where: {
      id: facultyId,
    },
  })
  if (!organization) {
    throw new Error(`The organization with the id ${facultyId} was not found.`)
  }
  return organization.code
}
