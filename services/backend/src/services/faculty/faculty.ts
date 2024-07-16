import { uniqBy } from 'lodash'
import { Op } from 'sequelize'

import { dbConnections } from '../../database/connection'
const { sequelize } = dbConnections
import { ExtentCode } from '../../types/extentCode'
import { PriorityCode } from '../../types/priorityCode'
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
import {
  formatFacultyProgramme,
  formatFacultyProgrammeStudents,
  formatFacultyStudyRight,
  formatFacultyThesisWriter,
  formatOrganization,
} from './facultyFormatHelpers'
import { getExtentFilter, isNewProgramme, mapCodesToIds } from './facultyHelpers'

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

export const getStudyRightsByExtent = async (faculty, startDate, endDate, code, extents, graduated) =>
  (
    await Studyright.findAll({
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
        facultyCode: faculty,
        extentcode: {
          [Op.in]: extents,
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
    })
  ).map(formatFacultyStudyRight)

export const getStudyRightsByBachelorStart = async (faculty, startDate, endDate, code, extents, graduated) =>
  (
    await Studyright.findAll({
      include: {
        model: StudyrightElement,
        required: true,
        where: {
          code,
        },
      },
      where: {
        facultyCode: faculty,
        extentcode: {
          [Op.in]: extents,
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
    })
  ).map(formatFacultyStudyRight)

export const getStudentsByStudentnumbers = async studentnumbers =>
  (
    await Student.findAll({
      where: {
        studentnumber: studentnumbers,
      },
      include: {
        model: SemesterEnrollment,
        attributes: ['semestercode', 'enrollmenttype'],
      },
    })
  ).map(formatFacultyProgrammeStudents)

export const hasMasterRight = async id => {
  return await Studyright.findOne({
    where: {
      studyrightid: id,
      extentcode: ExtentCode.MASTER,
    },
  })
}

export const degreeProgrammesOfFaculty = async facultyCode =>
  // Some programmenames are different, causing this to return multiples of same codes.
  // Hence the uniqBy
  uniqBy(
    (
      await ProgrammeModule.findAll({
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
      })
    ).map(formatFacultyProgramme),
    'code'
  )

export const facultyOrganizationId = async faculty => {
  return await Organization.findOne({
    attributes: ['id'],
    where: {
      code: faculty,
    },
  })
}

export const getChildOrganizations = async facultyId =>
  (
    await Organization.findAll({
      attributes: ['id', 'name', 'code', 'parent_id'],
      where: {
        parent_id: facultyId,
      },
    })
  ).map(formatOrganization)

export const thesisWriters = async (provider, since, thesisTypes, students) =>
  (
    await Credit.findAll({
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
        credittypecode: 4,
        isStudyModule: {
          [Op.not]: true,
        },
        attainment_date: {
          [Op.gte]: since,
        },
        student_studentnumber: students.length > 0 ? students : { [Op.not]: null },
      },
    })
  ).map(formatFacultyThesisWriter)

// Some programme modules are not directly associated to a faculty (organization).
// Some have intermediate organizations, such as department, so the connection must be digged up
export const findFacultyProgrammeCodes = async (faculty, programmeFilter) => {
  let allProgrammes = []
  let allProgrammeCodes = []

  const directAssociationProgrammes = await degreeProgrammesOfFaculty(faculty)

  allProgrammes = allProgrammes.concat(directAssociationProgrammes)
  allProgrammeCodes = allProgrammeCodes.concat(directAssociationProgrammes.map(prog => prog.code))

  // find faculty's organization id and its direct child organizations
  const { id } = await facultyOrganizationId(faculty)
  const facultyChildOrganizations = await getChildOrganizations(id)

  // get programme modules that have a faculty child as organization(_id)
  for (const org of facultyChildOrganizations) {
    const childAssociationProgrammes = await degreeProgrammesOfFaculty(org.code)
    if (childAssociationProgrammes.length > 0) {
      // eslint-disable-next-line no-loop-func
      childAssociationProgrammes.forEach(prog => {
        if (!(prog.code in allProgrammeCodes)) {
          allProgrammes = allProgrammes.concat([prog])
          allProgrammeCodes = allProgrammeCodes.concat([prog.code])
        }
      })
    } else {
      // dig deeper
      const grandChildren = await getChildOrganizations(org.id)
      if (grandChildren.length > 0) {
        for (const gcOrg of grandChildren) {
          const associatedProgrammes = await degreeProgrammesOfFaculty(gcOrg.code)
          if (associatedProgrammes.length > 0) {
            // eslint-disable-next-line no-loop-func
            associatedProgrammes.forEach(prog => {
              if (!(prog.code in allProgrammeCodes)) {
                allProgrammes = allProgrammes.concat([prog])
                allProgrammeCodes = allProgrammeCodes.concat([prog.code])
              }
            })
          }
        }
      }
    }
  }

  if (programmeFilter === 'NEW_STUDY_PROGRAMMES') {
    allProgrammes = allProgrammes.filter(prog => isNewProgramme(prog.code))
  }

  mapCodesToIds(allProgrammes)

  return allProgrammes
}
