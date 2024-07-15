import { Op } from 'sequelize'

import { Transfer } from '../../models'
import { formatFacultyTransfer } from './facultyFormatHelpers'

export const transferredFaculty = async (
  programmeCodeIn: string[],
  programmeCodeOut: string[],
  start: Date,
  end: Date
) =>
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

export const transferredInsideFaculty = async (programmeCodes: string[], allProgrammeCodes: string[], since: Date) =>
  (
    await Transfer.findAll({
      where: {
        transferdate: {
          [Op.gte]: since,
        },
        sourcecode: allProgrammeCodes,
        targetcode: programmeCodes,
      },
    })
  ).map(formatFacultyTransfer)

export const transferredAway = async (programmeCodes: string[], allProgrammeCodes: string[], since: Date) =>
  (
    await Transfer.findAll({
      where: {
        transferdate: {
          [Op.gte]: since,
        },
        sourcecode: programmeCodes,
        targetcode: {
          [Op.notIn]: allProgrammeCodes,
        },
      },
    })
  ).map(formatFacultyTransfer)

export const transferredTo = async (programmeCodes: string[], allProgrammeCodes: string[], since: Date) =>
  (
    await Transfer.findAll({
      where: {
        transferdate: {
          [Op.gte]: since,
        },
        sourcecode: {
          [Op.notIn]: allProgrammeCodes,
        },
        targetcode: programmeCodes,
      },
    })
  ).map(formatFacultyTransfer)

export const getTransferredToAndAway = async (programmeCodes: string[], allProgrammeCodes: string[], since: Date) => {
  const awayTransfers = await transferredAway(programmeCodes, allProgrammeCodes, since)
  const toTransfers = await transferredTo(programmeCodes, allProgrammeCodes, since)
  return [...toTransfers, ...awayTransfers]
}

export const getTransferredInside = async (programmeCodes: string[], allProgrammeCodes: string[], since: Date) => {
  return await transferredInsideFaculty(programmeCodes, allProgrammeCodes, since)
}

export const getTransfersOut = async (programmeCode: string, start: Date, end: Date) => {
  return await transferredFaculty([], [programmeCode], start, end)
}

export const getTransfersIn = async (programmeCode: string, start: Date, end: Date) => {
  return await transferredFaculty([programmeCode], [], start, end)
}
