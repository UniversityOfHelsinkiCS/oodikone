import { uniqBy } from 'lodash'
import { Op } from 'sequelize'

import { dbConnections } from '../../database/connection'
import {
  Course,
  Credit,
  ElementDetail,
  Organization,
  ProgrammeModule,
  SemesterEnrollment,
  Student,
  Studyright,
  StudyrightElement,
} from '../../models'
import { CreditTypeCode, ExtentCode, PriorityCode } from '../../types'
import {
  formatFacultyProgramme,
  formatFacultyProgrammeStudents,
  formatFacultyStudyRight,
  formatFacultyThesisWriter,
  formatOrganization,
} from './facultyFormatHelpers'
import { getExtentFilter, isNewProgramme, mapCodesToIds } from './facultyHelpers'

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

export const getStudentsByStudentnumbers = async (studentNumbers: string[]) => {
  const query: Record<string, any> = {
    where: {
      studentnumber: studentNumbers,
    },
    include: {
      model: SemesterEnrollment,
      attributes: ['semestercode', 'enrollmenttype'],
    },
  }
  const students = await Student.findAll(query)
  return students.map(formatFacultyProgrammeStudents)
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

export const degreeProgrammesOfFaculty = async (facultyCode: string) => {
  const query: Record<string, any> = {
    attributes: ['code', 'name'],
    include: {
      model: Organization,
      where: {
        code: {
          [Op.startsWith]: facultyCode,
        },
      },
    },
    group: ['programme_module.code', 'programme_module.name', 'organization.id'],
  }

  const programmes = await ProgrammeModule.findAll(query)
  return uniqBy(programmes.map(formatFacultyProgramme), 'code')
}

export const facultyOrganizationId = async (facultyCode: string) => {
  return await Organization.findOne({
    attributes: ['id'],
    where: {
      code: facultyCode,
    },
  })
}

export const getChildOrganizations = async (facultyId: string) => {
  const query: Record<string, any> = {
    attributes: ['id', 'name', 'code', 'parent_id'],
    where: {
      parent_id: facultyId,
    },
  }

  const organizations = await Organization.findAll(query)
  return organizations.map(formatOrganization)
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

// Some programme modules are not directly associated to a faculty (organization).
// Some have intermediate organizations, such as department, so the connection must be digged up
export const findFacultyProgrammeCodes = async (facultyCode: string, programmeFilter: string) => {
  let allProgrammes = []
  let allProgrammeCodes = []

  const directAssociationProgrammes = await degreeProgrammesOfFaculty(facultyCode)

  allProgrammes = allProgrammes.concat(directAssociationProgrammes)
  allProgrammeCodes = allProgrammeCodes.concat(directAssociationProgrammes.map(programme => programme.code))

  // find faculty's organization id and its direct child organizations
  const { id } = await facultyOrganizationId(facultyCode)
  const facultyChildOrganizations = await getChildOrganizations(id)

  // get programme modules that have a faculty child as organization(_id)
  for (const org of facultyChildOrganizations) {
    const childAssociationProgrammes = await degreeProgrammesOfFaculty(org.code)
    if (childAssociationProgrammes.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-loop-func
      childAssociationProgrammes.forEach(programme => {
        if (!(programme.code in allProgrammeCodes)) {
          allProgrammes = allProgrammes.concat([programme])
          allProgrammeCodes = allProgrammeCodes.concat([programme.code])
        }
      })
    } else {
      // dig deeper
      const grandChildren = await getChildOrganizations(org.id)
      if (grandChildren.length > 0) {
        for (const gcOrg of grandChildren) {
          const associatedProgrammes = await degreeProgrammesOfFaculty(gcOrg.code)
          if (associatedProgrammes.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-loop-func
            associatedProgrammes.forEach(programme => {
              if (!(programme.code in allProgrammeCodes)) {
                allProgrammes = allProgrammes.concat([programme])
                allProgrammeCodes = allProgrammeCodes.concat([programme.code])
              }
            })
          }
        }
      }
    }
  }

  if (programmeFilter === 'NEW_STUDY_PROGRAMMES') {
    allProgrammes = allProgrammes.filter(programme => isNewProgramme(programme.code))
  }

  mapCodesToIds(allProgrammes)

  return allProgrammes
}
