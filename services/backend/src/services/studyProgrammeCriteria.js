const { ProgressCriteria } = require('../models/models_kone')
const logger = require('../util/logger')

const getCriteriaByStudyProgramme = code =>
  ProgressCriteria.findOne({
    where: {
      code: code,
    },
  })

const formattedData = updatedData => {
  const criteria = {
    courses: {
      yearOne: updatedData.coursesYearOne,
      yearTwo: updatedData.coursesYearTwo,
      yearThree: updatedData.coursesYearThree,
    },
    credits: {
      yearOne: updatedData.creditsYearOne,
      yearTwo: updatedData.creditsYearTwo,
      yearThree: updatedData.creditsYearThree,
    },
  }
  return criteria
}

const createCriteria = async (studyProgramme, coYear1, coYear2, coYear3, crYear1, crYear2, crYear3) => {
  const newProgrammeCriteria = {
    code: studyProgramme,
    coursesYearOne: coYear1,
    coursesYearTwo: coYear2,
    coursesYearThree: coYear3,
    creditsYearOne: crYear1,
    creditsYearTwo: crYear2,
    creditsYearThree: crYear3,
  }
  try {
    const createdData = await ProgressCriteria.create(newProgrammeCriteria)
    const criteria = formattedData(createdData)
    return criteria
  } catch (error) {
    logger.error(`Create criteria failed: ${error}`)
  }
}

const saveYearlyCreditCriteria = async (studyProgramme, credits) => {
  const studyProgrammeToUpdate = await getCriteriaByStudyProgramme(studyProgramme)
  if (!studyProgrammeToUpdate) {
    return await createCriteria(
      studyProgramme,
      [],
      [],
      [],
      parseInt(credits.year1),
      parseInt(credits.year2),
      parseInt(credits.year3)
    )
  }
  const yearlyCredits = {
    creditsYearOne: parseInt(credits.year1),
    creditsYearTwo: parseInt(credits.year2),
    creditsYearThree: parseInt(credits.year3),
  }

  try {
    const updatedData = await studyProgrammeToUpdate.update({ ...yearlyCredits })
    const criteria = formattedData(updatedData)
    return criteria
  } catch (error) {
    logger.error(`Update yearly credit criteria failed: ${error}`)
  }
}

const saveYearlyCourseCriteria = async (studyProgramme, courses, year) => {
  const studyProgrammeToUpdate = await getCriteriaByStudyProgramme(studyProgramme)

  if (!studyProgrammeToUpdate) {
    const courseObj = { year1: [], year2: [], year3: [] }
    if (year === 1) {
      courseObj.year1 = courses
    } else if (year === 2) {
      courseObj.year2 = courses
    } else {
      courseObj.year3 = courses
    }
    return await createCriteria(studyProgramme, courseObj.year1, courseObj.year2, courseObj.year3, 0, 0, 0)
  }

  try {
    let updatedData = {}
    if (year === 1) updatedData = await studyProgrammeToUpdate.update({ coursesYearOne: courses })
    if (year === 2) updatedData = await studyProgrammeToUpdate.update({ coursesYearTwo: courses })
    if (year === 3) updatedData = await studyProgrammeToUpdate.update({ coursesYearThree: courses })
    const criteria = formattedData(updatedData)
    return criteria
  } catch (error) {
    logger.error(`Update yearly credit criteria failed: ${error}`)
  }
}

const getCriteria = async studyProgramme => {
  const studyProgrammeCriteria = await getCriteriaByStudyProgramme(studyProgramme)
  const criteria = {
    courses: {
      yearOne: studyProgrammeCriteria ? studyProgrammeCriteria.coursesYearOne : [],
      yearTwo: studyProgrammeCriteria ? studyProgrammeCriteria.coursesYearTwo : [],
      yearThree: studyProgrammeCriteria ? studyProgrammeCriteria.coursesYearThree : [],
    },
    credits: {
      yearOne: studyProgrammeCriteria ? studyProgrammeCriteria.creditsYearOne : 0,
      yearTwo: studyProgrammeCriteria ? studyProgrammeCriteria.creditsYearTwo : 0,
      yearThree: studyProgrammeCriteria ? studyProgrammeCriteria.creditsYearThree : 0,
    },
  }
  return criteria
}

module.exports = {
  getCriteria,
  saveYearlyCourseCriteria,
  saveYearlyCreditCriteria,
}
