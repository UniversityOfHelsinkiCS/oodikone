const { ProgressCriteria } = require('../models/models_kone')
const { Course } = require('../models')
const logger = require('../util/logger')

const getCriteriaByStudyProgramme = async code => {
  if (code === '') return null
  return await ProgressCriteria.findOne({
    where: {
      code: code,
    },
  })
}

const getSubstitutions = async codes => {
  if (codes === []) return []
  const courses = await Course.findAll({ where: { code: codes }, attributes: ['code', 'substitutions'], raw: true })
  return courses.reduce((acc, { code, substitutions }) => ({ ...acc, [code]: substitutions }), {})
}

const formattedData = async data => {
  const yearOne = data.coursesYearOne ? data.coursesYearOne : []
  const yearTwo = data.coursesYearTwo ? data.coursesYearTwo : []
  const yearThree = data.coursesYearThree ? data.coursesYearThree : []
  const yearFour = data.coursesYearFour ? data.coursesYearFour : []
  const yearFive = data.coursesYearFive ? data.coursesYearFive : []
  const yearSix = data.coursesYearSix ? data.coursesYearSix : []
  const courseCodes = [...yearOne, ...yearTwo, ...yearThree, ...yearFour, ...yearFive, ...yearSix]
  const allCourses = await getSubstitutions(courseCodes)

  const criteria = {
    courses: { yearOne, yearTwo, yearThree, yearFour, yearFive, yearSix },
    allCourses,
    credits: {
      yearOne: data.creditsYearOne ? data.creditsYearOne : 0,
      yearTwo: data.creditsYearTwo ? data.creditsYearTwo : 0,
      yearThree: data.creditsYearThree ? data.creditsYearThree : 0,
      yearFour: data.creditsYearFour ? data.creditsYearFour : 0,
      yearFive: data.creditsYearFive ? data.creditsYearFive : 0,
      yearSix: data.creditsYearSix ? data.creditsYearSix : 0,
    },
  }
  return criteria
}

const createCriteria = async (studyProgramme, courseObj, creditsObj) => {
  const newProgrammeCriteria = {
    code: studyProgramme,
    coursesYearOne: courseObj.year1,
    coursesYearTwo: courseObj.year2,
    coursesYearThree: courseObj.year3,
    coursesYearFour: courseObj.year4,
    coursesYearFive: courseObj.year5,
    coursesYearSix: courseObj.year6,
    creditsYearOne: creditsObj.year1,
    creditsYearTwo: creditsObj.year2,
    creditsYearThree: creditsObj.year3,
    creditsYearFour: creditsObj.year4,
    creditsYearFive: creditsObj.year5,
    creditsYearSix: creditsObj.year6,
  }
  try {
    const createdData = await ProgressCriteria.create(newProgrammeCriteria)
    return await formattedData(createdData)
  } catch (error) {
    logger.error(`Create criteria failed: ${error}`)
  }
}

const saveYearlyCreditCriteria = async (studyProgramme, credits) => {
  const studyProgrammeToUpdate = await getCriteriaByStudyProgramme(studyProgramme)
  if (!studyProgrammeToUpdate) {
    const courseObj = { year1: [], year2: [], year3: [], year4: [], year5: [], year6: [] }
    const creditsObj = {
      year1: parseInt(credits.year1),
      year2: parseInt(credits.year2),
      year3: parseInt(credits.year3),
      year4: parseInt(credits.year4),
      year5: parseInt(credits.year5),
      year6: parseInt(credits.year6),
    }
    return await createCriteria(studyProgramme, courseObj, creditsObj)
  }
  const yearlyCredits = {
    creditsYearOne: parseInt(credits.year1),
    creditsYearTwo: parseInt(credits.year2),
    creditsYearThree: parseInt(credits.year3),
    creditsYearFour: parseInt(credits.year4),
    creditsYearFive: parseInt(credits.year5),
    creditsYearSix: parseInt(credits.year6),
  }
  try {
    const updatedData = await studyProgrammeToUpdate.update({ ...yearlyCredits })
    return await formattedData(updatedData)
  } catch (error) {
    logger.error(`Update yearly credit criteria failed: ${error}`)
  }
}

const saveYearlyCourseCriteria = async (studyProgramme, courses, year) => {
  const studyProgrammeToUpdate = await getCriteriaByStudyProgramme(studyProgramme)
  if (!studyProgrammeToUpdate) {
    const courseObj = { year1: [], year2: [], year3: [], year4: [], year5: [], year6: [] }
    const creditObj = { year1: 0, year2: 0, year3: 0, year4: 0, year5: 0, year6: 0 }
    if (year === 1) {
      courseObj.year1 = courses
    } else if (year === 2) {
      courseObj.year2 = courses
    } else if (year === 3) {
      courseObj.year3 = courses
    } else if (year === 4) {
      courseObj.year4 = courses
    } else if (year === 5) {
      courseObj.year5 = courses
    } else {
      courseObj.year6 = courses
    }
    return await createCriteria(studyProgramme, courseObj, creditObj)
  }

  try {
    let updatedData = {}
    if (year === 1) updatedData = await studyProgrammeToUpdate.update({ coursesYearOne: courses })
    if (year === 2) updatedData = await studyProgrammeToUpdate.update({ coursesYearTwo: courses })
    if (year === 3) updatedData = await studyProgrammeToUpdate.update({ coursesYearThree: courses })
    if (year === 4) updatedData = await studyProgrammeToUpdate.update({ coursesYearFour: courses })
    if (year === 5) updatedData = await studyProgrammeToUpdate.update({ coursesYearFive: courses })
    if (year === 6) updatedData = await studyProgrammeToUpdate.update({ coursesYearSix: courses })
    return await formattedData(updatedData)
  } catch (error) {
    logger.error(`Update yearly credit criteria failed: ${error}`)
  }
}

const getCriteria = async studyProgramme => {
  const studyProgrammeCriteria = await getCriteriaByStudyProgramme(studyProgramme)
  const criteria = {
    courses: { yearOne: [], yearTwo: [], yearThree: [], yearFour: [], yearFive: [], yearSix: [] },
    allCourses: [],
    credits: { yearOne: 0, yearTwo: 0, yearThree: 0, yearFour: 0, yearFive: 0, yearSix: 0 },
  }
  return studyProgrammeCriteria ? await formattedData(studyProgrammeCriteria) : criteria
}

module.exports = {
  getCriteria,
  saveYearlyCourseCriteria,
  saveYearlyCreditCriteria,
}
