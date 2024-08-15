import { groupBy, orderBy } from 'lodash'
import moment from 'moment'
import { InferAttributes, Op, QueryTypes } from 'sequelize'

import { programmeCodes } from '../../config/programmeCodes'
import { dbConnections } from '../../database/connection'
import { ElementDetail, Organization, ProgrammeModule, Studyright, StudyrightElement } from '../../models'
import { ExtentCode, PriorityCode } from '../../types'
import { getSemestersAndYears } from '../semesters'
import { formatFacultyStudyRight } from './facultyFormatHelpers'

const { sequelize } = dbConnections

export const getStudyRightsByExtent = async (
  facultyCode: string,
  startDate: Date,
  endDate: Date,
  code: string,
  extentCodes: ExtentCode[],
  graduated: number[]
) => {
  const query: Record<string, any> = {
    include: {
      model: StudyrightElement,
      attributes: [],
      required: true,
      where: {
        code,
      },
      include: [
        {
          model: ElementDetail,
          attributes: [],
        },
      ],
    },
    group: [sequelize.col('studyright.studyrightid')],
    where: {
      facultyCode,
      extentcode: {
        [Op.in]: extentCodes,
      },
      prioritycode: {
        [Op.not]: PriorityCode.OPTION,
      },
      graduated: {
        [Op.in]: graduated,
      },
      [Op.and]: [
        sequelize.where(
          sequelize.fn(
            'GREATEST',
            sequelize.col('studyright_elements.startdate'),
            sequelize.col('studyright.startdate')
          ),
          {
            [Op.between]: [startDate, endDate],
          }
        ),
      ],
    },
  }

  const studyRights = await Studyright.findAll(query)
  return studyRights.map(formatFacultyStudyRight)
}

export const getStudyRightsByBachelorStart = async (
  facultyCode: string,
  startDate: Date,
  endDate: Date,
  code: string,
  extentCodes: ExtentCode[],
  graduated: number[]
) => {
  const query: Record<string, any> = {
    include: {
      model: StudyrightElement,
      required: true,
      where: {
        code,
      },
    },
    where: {
      facultyCode,
      extentcode: {
        [Op.in]: extentCodes,
      },
      prioritycode: {
        [Op.not]: PriorityCode.OPTION,
      },
      graduated: {
        [Op.in]: graduated,
      },
      startdate: {
        [Op.between]: [startDate, endDate],
      },
    },
  }

  const studyRights = await Studyright.findAll(query)
  return studyRights.map(formatFacultyStudyRight)
}

const curriculumPeriodIdToYearCode = (curriculumPeriodId: string) => curriculumPeriodId.slice(-2)

// Some programme modules are not directly associated to a faculty (organization).
// Some have intermediate organizations, such as department, so the connection must be digged up
export const getDegreeProgrammesOfOrganization = async (organizationId: string, onlyCurrentProgrammes: boolean) => {
  type ProgrammeModuleWithRelevantAttributes = Pick<
    InferAttributes<ProgrammeModule>,
    'code' | 'name' | 'degreeProgrammeType' | 'curriculum_period_ids'
  > & { progId: string }
  const programmesOfOrganization: Array<Omit<ProgrammeModuleWithRelevantAttributes, 'progId'> & { valid_from: Date }> =
    await sequelize.query(
      `
      SELECT code, name, degree_programme_type as "degreeProgrammeType", curriculum_period_ids, valid_from
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
      programme.code in programmeCodes ? programmeCodes[programme.code as keyof typeof programmeCodes] : programme.code,
  }))
  const programmesGroupedByCode = groupBy(orderBy(programmesWithProgIds, ['valid_from'], ['desc']), prog => prog.code)

  const { years } = await getSemestersAndYears()
  const relevantProgrammes: ProgrammeModuleWithRelevantAttributes[] = []

  for (const programmeVersions of Object.values(programmesGroupedByCode)) {
    // Programmes are ordered by valid_from in descending order, so the first one whose valid_from date isn't in the future, is the newest version
    const newestProgrammeVersion = programmeVersions.find(prog => new Date() >= prog.valid_from)
    if (!newestProgrammeVersion) {
      continue
    }
    const { code, name, degreeProgrammeType, progId } = newestProgrammeVersion
    const yearsOfProgramme = programmeVersions
      .map(prog => prog.curriculum_period_ids.map(curriculumPeriodIdToYearCode))
      .flat()
    const isRelevantProgramme =
      !onlyCurrentProgrammes ||
      (onlyCurrentProgrammes &&
        yearsOfProgramme.some(year => moment().isBetween(years[year].startdate, years[year].enddate)))

    if (isRelevantProgramme) {
      relevantProgrammes.push({
        code,
        name,
        degreeProgrammeType,
        progId,
        curriculum_period_ids: programmeVersions.map(prog => prog.curriculum_period_ids).flat(),
      })
    }
  }

  return relevantProgrammes
}

export type ProgrammesOfOrganization = Awaited<ReturnType<typeof getDegreeProgrammesOfOrganization>>

export const getDegreeProgrammesOfFaculty = async (facultyCode: string, onlyCurrentProgrammes: boolean) => {
  const organization = await Organization.findOne({
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
