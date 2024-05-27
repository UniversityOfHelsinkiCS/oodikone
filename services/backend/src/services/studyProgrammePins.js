const { Op } = require('sequelize')

const { StudyProgrammePin } = require('../models/models_kone')

const findPinsByUserId = async userId => {
  return await StudyProgrammePin.findOne({
    where: {
      userId: {
        [Op.eq]: userId,
      },
    },
  })
}

const getStudyProgrammePins = async userId => {
  return await findPinsByUserId(userId)
}

const createStudyProgrammePin = async (userId, programmeCode) => {
  const existingPin = await findPinsByUserId(userId)

  if (!existingPin) {
    return await StudyProgrammePin.create({
      userId,
      studyProgrammes: [programmeCode],
    })
  }

  const updatedStudyProgrammes = [...existingPin.studyProgrammes, programmeCode]
  await existingPin.update({ studyProgrammes: updatedStudyProgrammes })
  return existingPin
}

const removeStudyProgrammePin = async (userId, programmeCode) => {
  const existingPin = await findPinsByUserId(userId)

  if (!existingPin) {
    return null
  }

  const updatedStudyProgrammes = existingPin.studyProgrammes.filter(code => code !== programmeCode)
  await existingPin.update({ studyProgrammes: updatedStudyProgrammes })
  return existingPin
}

module.exports = { createStudyProgrammePin, getStudyProgrammePins, removeStudyProgrammePin }
