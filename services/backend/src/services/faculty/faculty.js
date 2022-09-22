const Sequelize = require('sequelize')
const { Op } = Sequelize
const {
  ElementDetail,
  Organization,
  ProgrammeModule,
  Semester,
  SemesterEnrollment,
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
  formatAbsence,
  isNewProgramme,
} = require('./facultyHelpers')

const getTransferredToAndAway = async (programmeCodes, allProgrammeCodes, since) => {
  const awayTransfers = (await transferredAway(programmeCodes, allProgrammeCodes, since)).map(t => t.studyrightid)
  const toTransfers = (await transferredTo(programmeCodes, allProgrammeCodes, since)).map(t => t.studyrightid)
  const transferredToOrAway = [...toTransfers, ...awayTransfers]
  return transferredToOrAway
}

const getTransferredInside = async (programmeCodes, allProgrammeCodes, since) => {
  const transfersInside = (await transferredInsideFaculty(programmeCodes, allProgrammeCodes, since)).map(
    t => t.studyrightid
  )
  return transfersInside
}
const startedStudyrights = async (faculty, since, studyRightWhere) =>
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
        ...studyRightWhere,
      },
    })
  ).map(facultyFormatStudyright)

const graduatedStudyrights = async (faculty, since, studyrightWhere) =>
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
        ...studyrightWhere,
      },
    })
  ).map(facultyFormatStudyright)

const studyrightsByRightStartYear = async (faculty, since, graduated = 1) =>
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
        startdate: {
          [Op.gte]: since,
        },
        graduated: graduated,
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

const thesisWriters = async (provider, since, thesisTypes, students) =>
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
        include: {
          model: Organization,
          attributes: [],
          required: true,
          where: {
            code: provider,
          },
        },
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

const statutoryAbsences = async (studentnumber, startdate, enddate) =>
  (
    await SemesterEnrollment.findAll({
      attributes: ['semestercode'],
      include: {
        model: Semester,
        attributes: ['startdate', 'enddate'],
        where: {
          startdate: {
            [Op.gte]: startdate,
          },
          enddate: {
            [Op.lte]: enddate,
          },
        },
      },
      where: {
        studentnumber: studentnumber,
        statutory_absence: true,
      },
    })
  ).map(formatAbsence)

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
  studyrightsByRightStartYear,
  bachelorStudyright,
  transferredInsideFaculty,
  transferredAway,
  transferredTo,
  degreeProgrammesOfFaculty,
  thesisWriters,
  findFacultyProgrammeCodes,
  facultyOgranizationId,
  statutoryAbsences,
  getTransferredToAndAway,
  getTransferredInside,
}
