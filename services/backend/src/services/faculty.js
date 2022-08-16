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
} = require('../models')
const {
  facultyFormatStudyright,
  facultyFormatProgramme,
  formatFacultyTransfer,
  formatFacultyThesisWriter,
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

const transferredInsideFaculty = async (programmes, since) =>
  (
    await Transfer.findAll({
      where: {
        transferdate: {
          [Op.gte]: since,
        },
        sourcecode: programmes,
        targetcode: programmes,
      },
    })
  ).map(formatFacultyTransfer)

const transferredAway = async (programmes, since) =>
  (
    await Transfer.findAll({
      where: {
        transferdate: {
          [Op.gte]: since,
        },
        sourcecode: programmes,
        targetcode: {
          [Op.notIn]: programmes,
        },
      },
    })
  ).map(formatFacultyTransfer)

const transferredTo = async (programmes, since) =>
  (
    await Transfer.findAll({
      where: {
        transferdate: {
          [Op.gte]: since,
        },
        sourcecode: {
          [Op.notIn]: programmes,
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
          code: facultyCode,
        },
      },
    })
  ).map(facultyFormatProgramme)

const getProgrammeName = async programme => {
  return await ElementDetail.findOne({
    attributes: ['name'],
    where: {
      code: programme,
    },
  })
}

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
          attributes: ['code'],
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

module.exports = {
  startedStudyrights,
  graduatedStudyrights,
  transferredInsideFaculty,
  transferredAway,
  transferredTo,
  degreeProgrammesOfFaculty,
  getProgrammeName,
  thesisWriters,
}
