const Sequelize = require('sequelize')
const { Op } = Sequelize
const {
  ElementDetail,
  Organization,
  ProgrammeModule,
  Studyright,
  StudyrightElement,
  Student,
  Transfer,
  Credit,
  Course,
} = require('../../models')
const {
  facultyFormatStudyright,
  facultyFormatProgramme,
  formatFacultyTransfer,
  formatFacultyThesisWriter,
  formatOrganization,
  isNewProgramme,
} = require('./facultyHelpers')

const startedStudyrights = async (faculty, since) =>
  (
    await Studyright.findAll({
      include: [
        {
          model: Student,
          attributes: ['studentnumber'],
          required: true,
        },
        {
          model: StudyrightElement,
          required: true,
          include: {
            model: ElementDetail,
            required: true,
          },
        },
      ],
      where: {
        faculty_code: faculty,
        studystartdate: {
          [Op.gte]: since,
        },
        student_studentnumber: { [Op.not]: null },
      },
    })
  ).map(facultyFormatStudyright)

const graduatedStudyrights = async (faculty, since) =>
  (
    await Studyright.findAll({
      include: [
        {
          model: Student,
          attributes: ['studentnumber'],
          required: true,
        },
        {
          model: StudyrightElement,
          required: true,
          include: {
            model: ElementDetail,
            required: true,
          },
        },
      ],
      where: {
        faculty_code: faculty,
        enddate: {
          [Op.gte]: since,
        },
        graduated: 1,
        student_studentnumber: { [Op.not]: null },
      },
    })
  ).map(facultyFormatStudyright)

const bachelorStudyright = async id => {
  return await Studyright.findOne({
    attributes: ['studystartdate'],
    where: {
      studyrightid: id,
      extentcode: 1,
    },
  })
}

const transferredInsideFaculty = async (programmes, allProgrammeCodes, since) =>
  (
    await Transfer.findAll({
      where: {
        transferdate: {
          [Op.gte]: since,
        },
        sourcecode: allProgrammeCodes,
        targetcode: programmes,
      },
    })
  ).map(formatFacultyTransfer)

const transferredAway = async (programmes, allProgrammeCodes, since) =>
  (
    await Transfer.findAll({
      where: {
        transferdate: {
          [Op.gte]: since,
        },
        sourcecode: programmes,
        targetcode: {
          [Op.notIn]: allProgrammeCodes,
        },
      },
    })
  ).map(formatFacultyTransfer)

const transferredTo = async (programmes, allProgrammeCodes, since) =>
  (
    await Transfer.findAll({
      where: {
        transferdate: {
          [Op.gte]: since,
        },
        sourcecode: {
          [Op.notIn]: allProgrammeCodes,
        },
        targetcode: programmes,
      },
    })
  ).map(formatFacultyTransfer)

const degreeProgrammesOfFaculty = async facultyCode =>
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
    })
  ).map(facultyFormatProgramme)

const facultyOgranizationId = async faculty => {
  return await Organization.findOne({
    attributes: ['id'],
    where: {
      code: faculty,
    },
  })
}

const getChildOrganizations = async facultyId =>
  (
    await Organization.findAll({
      attributes: ['id', 'name', 'code', 'parent_id'],
      where: {
        parent_id: facultyId,
      },
    })
  ).map(formatOrganization)

const thesisWriters = async (providers, since, thesisTypes) =>
  (
    await Credit.findAll({
      attributes: ['id', 'course_code', 'credits', 'attainment_date', 'student_studentnumber'],
      include: {
        model: Course,
        attributes: ['code', 'course_unit_type'],
        required: true,
        where: {
          course_unit_type: {
            [Op.in]: thesisTypes,
          },
        },
        include: {
          model: Organization,
          attributes: ['name', 'code'],
          required: true,
          where: {
            code: {
              [Op.in]: providers,
            },
          },
        },
      },
      where: {
        credittypecode: {
          [Op.notIn]: [10, 9, 7],
        },
        isStudyModule: {
          [Op.not]: true,
        },
        attainment_date: {
          [Op.gte]: since,
        },
        student_studentnumber: { [Op.not]: null },
      },
    })
  ).map(formatFacultyThesisWriter)

// Some programme modules are not directly associated to a faculty (organization).
// Some have intermediate organizations, such as department, so the connection must be digged up
const findFacultyProgrammeCodes = async (faculty, programmeFilter) => {
  let allProgrammes = []
  let allProgrammeCodes = []

  const directAssociationProgrammes = await degreeProgrammesOfFaculty(faculty)

  allProgrammes = allProgrammes.concat(directAssociationProgrammes)
  allProgrammeCodes = allProgrammeCodes.concat(directAssociationProgrammes.map(prog => prog.code))

  // find faculty's organization id and its direct child organizations
  const { id } = await facultyOgranizationId(faculty)
  const facultyChildOrganizations = await getChildOrganizations(id)

  // get programme modules that have a faculty child as organization(_id)
  for (const org of facultyChildOrganizations) {
    const childAssociationProgrammes = await degreeProgrammesOfFaculty(org.code)
    if (childAssociationProgrammes.length > 0) {
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

  return allProgrammes
}

module.exports = {
  startedStudyrights,
  graduatedStudyrights,
  bachelorStudyright,
  transferredInsideFaculty,
  transferredAway,
  transferredTo,
  degreeProgrammesOfFaculty,
  thesisWriters,
  findFacultyProgrammeCodes,
  facultyOgranizationId,
}
