const Sequelize = require('sequelize')
const { Op } = Sequelize
const {
  ElementDetail,
  Organization,
  ProgrammeModule,
  Studyright,
  StudyrightElement,
  SemesterEnrollment,
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
  mapCodesToIds,
  facultyProgrammeStudents,
} = require('./facultyHelpers')

const getTransferredToAndAway = async (programmeCodes, allProgrammeCodes, since) => {
  const awayTransfers = await transferredAway(programmeCodes, allProgrammeCodes, since)
  const toTransfers = await transferredTo(programmeCodes, allProgrammeCodes, since)
  return [...toTransfers, ...awayTransfers]
}

const getTransferredInside = async (programmeCodes, allProgrammeCodes, since) => {
  return await transferredInsideFaculty(programmeCodes, allProgrammeCodes, since)
}

const getTransfers = async (programmeCode, allProgrammeCodes, since, end) => {
  return await transferredFaculty(programmeCode, allProgrammeCodes, since, end)
}

const transferredFaculty = async (programme, allProgrammeCodes, since, end) =>
  (
    await Transfer.findAll({
      where: {
        transferdate: {
          [Op.between]: [since, end],
        },
        [Op.or]: [
          {
            sourcecode: allProgrammeCodes,
            targetcode: programme,
          },
          {
            sourcecode: programme,
            targetcode: {
              [Op.notIn]: allProgrammeCodes,
            },
          },
          {
            sourcecode: {
              [Op.notIn]: allProgrammeCodes,
            },
            targetcode: programme,
          },
        ],
      },
    })
  ).map(formatFacultyTransfer)

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
        facultyCode: faculty,
        startdate: {
          [Op.gte]: since,
        },
        studentStudentnumber: { [Op.not]: null },
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
        facultyCode: faculty,
        enddate: {
          [Op.gte]: since,
        },
        graduated: 1,
        studentStudentnumber: { [Op.not]: null },
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
        facultyCode: faculty,
        startdate: {
          [Op.gte]: since,
        },
        graduated: graduated,
        studentStudentnumber: { [Op.not]: null },
      },
    })
  ).map(facultyFormatStudyright)

const getStudyRightsByExtent = async (faculty, elementStart, studyrightStart, code, extents, graduated) =>
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
          where: {
            code: code,
            ...elementStart,
          },
          include: {
            model: ElementDetail,
            required: true,
            where: {
              type: 20,
            },
          },
        },
      ],
      where: {
        facultyCode: faculty,
        extentcode: {
          [Op.in]: extents,
        },
        graduated: {
          [Op.in]: graduated,
        },
        studystartdate: { [Op.not]: null },
        ...studyrightStart,
        studentStudentnumber: { [Op.not]: null },
      },
    })
  ).map(facultyFormatStudyright)

const getStudentsByStudentnumbers = async studentnumbers =>
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
  ).map(facultyProgrammeStudents)

const hasMasterRight = async id => {
  return await Studyright.findOne({
    where: {
      studyrightid: id,
      extentcode: 2,
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

  mapCodesToIds(allProgrammes)

  return allProgrammes
}

module.exports = {
  startedStudyrights,
  graduatedStudyrights,
  studyrightsByRightStartYear,
  hasMasterRight,
  transferredInsideFaculty,
  transferredAway,
  transferredTo,
  degreeProgrammesOfFaculty,
  thesisWriters,
  findFacultyProgrammeCodes,
  facultyOgranizationId,
  getTransferredToAndAway,
  getTransferredInside,
  getStudyRightsByExtent,
  getStudentsByStudentnumbers,
  getTransfers,
}
