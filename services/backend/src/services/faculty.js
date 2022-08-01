const Sequelize = require('sequelize')
const { Op } = Sequelize
const { ElementDetail, Studyright, StudyrightElement, Student, Transfer } = require('../models')
const { formatTransfer, formatStudyright } = require('./studyprogrammeHelpers')
const { facultyFormatStudyright } = require('./facultyHelpers')

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
  ).map(formatStudyright)

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
  ).map(formatTransfer)

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
  ).map(formatTransfer)

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
  ).map(formatTransfer)

module.exports = { startedStudyrights, graduatedStudyrights, transferredInsideFaculty, transferredAway, transferredTo }
