import moment from 'moment'
import { InferAttributes, Op, QueryTypes } from 'sequelize'

import { programmeCodes } from '../../config/programmeCodes'
import { dbConnections } from '../../database/connection'
import {
  Course,
  Credit,
  ElementDetail,
  Organization,
  ProgrammeModule,
  Studyright,
  StudyrightElement,
} from '../../models'
import { CreditTypeCode, ExtentCode, PriorityCode } from '../../types'
import { getSemestersAndYears } from '../semesters'
import { formatFacultyStudyRight, formatFacultyThesisWriter } from './facultyFormatHelpers'
import { getExtentFilter } from './facultyHelpers'

const { sequelize } = dbConnections

export const startedStudyrights = async (
  facultyCode: string,
  since: Date,
  code: string,
  includeAllSpecials: boolean
) => {
  const studyRightWhere = getExtentFilter(includeAllSpecials)

  const query = {
    include: [
      {
        model: StudyrightElement,
        required: true,
        where: {
          code,
        },
        include: [
          {
            model: ElementDetail,
            required: true,
          },
        ],
      },
    ],
    where: {
      facultyCode,
      startdate: {
        [Op.gte]: since,
      },
      ...studyRightWhere,
    },
  }

  const studyRights = await Studyright.findAll(query)
  return studyRights.map(formatFacultyStudyRight)
}

export const graduatedStudyrights = async (
  facultyCode: string,
  since: Date,
  code: string,
  includeAllSpecials?: boolean
) => {
  const studyRightWhere = includeAllSpecials !== undefined ? getExtentFilter(includeAllSpecials) : {}

  const query: Record<string, any> = {
    include: [
      {
        model: StudyrightElement,
        required: true,
        where: {
          code,
        },
        include: [
          {
            model: ElementDetail,
            required: true,
          },
        ],
      },
    ],
    where: {
      facultyCode,
      enddate: {
        [Op.gte]: since,
      },
      graduated: 1,
      ...studyRightWhere,
    },
  }

  const studyRights = await Studyright.findAll(query)
  return studyRights.map(formatFacultyStudyRight)
}

export const studyrightsByRightStartYear = async (
  facultyCode: string,
  since: Date,
  code: string | null = null,
  graduated: number | number[] = 1
) => {
  const query: Record<string, any> = {
    include: [
      {
        model: StudyrightElement,
        attributes: ['code', 'startdate'],
        required: true,
        include: [
          {
            model: ElementDetail,
            required: true,
          },
        ],
      },
    ],
    where: {
      facultyCode,
      startdate: {
        [Op.gte]: since,
      },
      graduated,
    },
  }

  if (code !== null) {
    query.include[0].where = { code }
  }

  const studyRights = await Studyright.findAll(query)
  return studyRights.map(formatFacultyStudyRight)
}

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

export const hasMasterRight = async (studyRightId: string): Promise<boolean> => {
  const studyRight = await Studyright.findOne({
    where: {
      studyrightid: studyRightId,
      extentcode: ExtentCode.MASTER,
    },
  })
  return studyRight !== null
}

export const thesisWriters = async (provider: string, since: Date, thesisTypes: string[], studentNumbers: string[]) => {
  const query: Record<string, any> = {
    attributes: ['id', 'course_code', 'attainment_date', 'student_studentnumber'],
    include: {
      model: Course,
      attributes: ['course_unit_type'],
      required: true,
      where: {
        course_unit_type: {
          [Op.in]: thesisTypes,
        },
      },
      include: [
        {
          model: Organization,
          attributes: [],
          required: true,
          where: {
            code: provider,
          },
        },
      ],
    },
    where: {
      credittypecode: CreditTypeCode.PASSED,
      isStudyModule: {
        [Op.not]: true,
      },
      attainment_date: {
        [Op.gte]: since,
      },
      student_studentnumber: studentNumbers.length > 0 ? studentNumbers : { [Op.not]: null },
    },
  }

  const thesisWriterCredits = await Credit.findAll(query)
  return thesisWriterCredits.map(formatFacultyThesisWriter)
}

const curriculumPeriodIdToYearCode = (curriculumPeriodId: string) => curriculumPeriodId.slice(-2)

// Some programme modules are not directly associated to a faculty (organization).
// Some have intermediate organizations, such as department, so the connection must be digged up
export const getDegreeProgrammesOfOrganization = async (organizationId: string, onlyCurrentProgrammes: boolean) => {
  type ProgrammeModuleWithRelevantAttributes = Pick<
    InferAttributes<ProgrammeModule>,
    'code' | 'name' | 'degreeProgrammeType' | 'curriculum_period_ids'
  > & { progId: string }
  const programmesOfOrganization: Array<Omit<ProgrammeModuleWithRelevantAttributes, 'progId'>> = await sequelize.query(
    `
      SELECT code, name, degree_programme_type as "degreeProgrammeType", curriculum_period_ids
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
  const { years } = await getSemestersAndYears()
  const relevantProgrammes: ProgrammeModuleWithRelevantAttributes[] = []
  for (const programme of programmesWithProgIds) {
    const yearsOfProgramme = programme.curriculum_period_ids.map(curriculumPeriodIdToYearCode)
    if (onlyCurrentProgrammes) {
      if (yearsOfProgramme.some(year => moment().isBetween(years[year].startdate, years[year].enddate))) {
        relevantProgrammes.push(programme)
      }
      continue
    }

    const currentProgrammeInArray = relevantProgrammes.find(p => p.code === programme.code)
    if (!currentProgrammeInArray) {
      relevantProgrammes.push(programme)
      continue
    }
    const maximumEndDateForCurrentProgramme = moment.max(
      currentProgrammeInArray.curriculum_period_ids.map(id => years[curriculumPeriodIdToYearCode(id)].enddate)
    )
    if (yearsOfProgramme.some(year => years[year].enddate.isAfter(maximumEndDateForCurrentProgramme))) {
      relevantProgrammes.splice(
        relevantProgrammes.findIndex(p => p.code === programme.code),
        1,
        programme
      )
    }
  }
  return relevantProgrammes
}

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
