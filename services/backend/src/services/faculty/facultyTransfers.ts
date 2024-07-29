import { Op } from 'sequelize'

import { Transfer } from '../../models'
import { formatFacultyTransfer } from './facultyFormatHelpers'

const transferredFaculty = async (programmeCodeIn: string[], programmeCodeOut: string[], start: Date, end: Date) =>
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

export const getTransfersOut = async (programmeCode: string, start: Date, end: Date) => {
  return await transferredFaculty([], [programmeCode], start, end)
}

export const getTransfersIn = async (programmeCode: string, start: Date, end: Date) => {
  return await transferredFaculty([programmeCode], [], start, end)
}
