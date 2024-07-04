const { Op } = require('sequelize')

const { Transfer } = require('../../models')
const { formatFacultyTransfer } = require('./format')

const transferredFaculty = async (programmeCodeIn, programmeCodeOut, start, end) =>
  (
    await Transfer.findAll({
      where: {
        transferdate: {
          [Op.between]: [start, end],
        },
        [Op.or]: [
          {
            sourcecode: programmeCodeOut,
          },
          {
            targetcode: programmeCodeIn,
          },
        ],
      },
    })
  ).map(formatFacultyTransfer)

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

const getTransferredToAndAway = async (programmeCodes, allProgrammeCodes, since) => {
  const awayTransfers = await transferredAway(programmeCodes, allProgrammeCodes, since)
  const toTransfers = await transferredTo(programmeCodes, allProgrammeCodes, since)
  return [...toTransfers, ...awayTransfers]
}

const getTransferredInside = async (programmeCodes, allProgrammeCodes, since) => {
  return await transferredInsideFaculty(programmeCodes, allProgrammeCodes, since)
}

const getTransfersIn = async (programmeCode, start, end) => {
  return await transferredFaculty([programmeCode], [], start, end)
}

const getTransfersOut = async (programmeCode, start, end) => {
  return await transferredFaculty([], [programmeCode], start, end)
}

module.exports = {
  getTransferredToAndAway,
  getTransferredInside,
  getTransfersIn,
  getTransfersOut,
  transferredAway,
  transferredInsideFaculty,
  transferredTo,
}
