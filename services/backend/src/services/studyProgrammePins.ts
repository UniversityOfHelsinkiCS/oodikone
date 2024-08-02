import { Op } from 'sequelize'

import { StudyProgrammePin } from '../models/kone'

const findPinsByUserId = async (userId: string) => {
  return await StudyProgrammePin.findOne({
    where: {
      userId: {
        [Op.eq]: userId,
      },
    },
  })
}

export const getStudyProgrammePins = async (userId: string) => {
  return await findPinsByUserId(userId)
}

export const createStudyProgrammePin = async (userId: string, programmeCode: string) => {
  const existingPin = await findPinsByUserId(userId)
  if (!existingPin) {
    return await StudyProgrammePin.create({
      userId: Number(userId),
      studyProgrammes: [programmeCode],
    })
  }

  const updatedStudyProgrammes = [...existingPin.studyProgrammes, programmeCode]
  await existingPin.update({ studyProgrammes: updatedStudyProgrammes })
  return existingPin
}

export const removeStudyProgrammePin = async (userId: string, programmeCode: string) => {
  const existingPin = await findPinsByUserId(userId)
  if (!existingPin) {
    return null
  }

  const updatedStudyProgrammes = existingPin.studyProgrammes.filter(code => code !== programmeCode)
  await existingPin.update({ studyProgrammes: updatedStudyProgrammes })
  return existingPin
}
