import { Course } from '../../models'
import { ProgressCriteria } from '../../models/kone'
import logger from '../../util/logger'

type Criteria = Omit<ProgressCriteria, 'curriculumVersion'>

const getCriteriaByStudyProgramme = async (code: string) => {
  if (code === '') {
    return null
  }
  const criteria: Criteria | null = await ProgressCriteria.findOne({
    attributes: { exclude: ['curriculumVersion'] },
    where: {
      code,
    },
  })
  return criteria
}

const getSubstitutions = async (codes: string[]) => {
  if (!codes.length) {
    return {}
  }
  const courses: Array<Pick<Course, 'code' | 'substitutions'>> = await Course.findAll({
    attributes: ['code', 'substitutions'],
    where: { code: codes },
    raw: true,
  })
  const substitutions: Record<string, string[]> = courses.reduce(
    (acc, { code, substitutions }) => ({ ...acc, [code]: substitutions }),
    {}
  )
  return substitutions
}

type FormattedCriteria = {
  courses: {
    yearOne: string[]
    yearTwo: string[]
    yearThree: string[]
    yearFour: string[]
    yearFive: string[]
    yearSix: string[]
  }
  allCourses: Record<string, string[]>
  credits: {
    yearOne: number
    yearTwo: number
    yearThree: number
    yearFour: number
    yearFive: number
    yearSix: number
  }
}

const formatCriteria = async (criteria: Criteria) => {
  const yearOne = criteria.coursesYearOne || []
  const yearTwo = criteria.coursesYearTwo || []
  const yearThree = criteria.coursesYearThree || []
  const yearFour = criteria.coursesYearFour || []
  const yearFive = criteria.coursesYearFive || []
  const yearSix = criteria.coursesYearSix || []
  const courseCodes = [...yearOne, ...yearTwo, ...yearThree, ...yearFour, ...yearFive, ...yearSix]
  const allCourses = await getSubstitutions(courseCodes)

  const formattedCriteria: FormattedCriteria = {
    courses: { yearOne, yearTwo, yearThree, yearFour, yearFive, yearSix },
    allCourses,
    credits: {
      yearOne: criteria.creditsYearOne || 0,
      yearTwo: criteria.creditsYearTwo || 0,
      yearThree: criteria.creditsYearThree || 0,
      yearFour: criteria.creditsYearFour || 0,
      yearFive: criteria.creditsYearFive || 0,
      yearSix: criteria.creditsYearSix || 0,
    },
  }
  return formattedCriteria
}

const createCriteria = async (
  studyProgramme: string,
  courses: Record<string, string[]>,
  credits: Record<string, number>
) => {
  const newProgrammeCriteria = {
    code: studyProgramme,
    curriculumVersion: '',
    coursesYearOne: courses.year1,
    coursesYearTwo: courses.year2,
    coursesYearThree: courses.year3,
    coursesYearFour: courses.year4,
    coursesYearFive: courses.year5,
    coursesYearSix: courses.year6,
    creditsYearOne: credits.year1,
    creditsYearTwo: credits.year2,
    creditsYearThree: credits.year3,
    creditsYearFour: credits.year4,
    creditsYearFive: credits.year5,
    creditsYearSix: credits.year6,
  }
  try {
    const createdCriteria = await ProgressCriteria.create(newProgrammeCriteria)
    return await formatCriteria(createdCriteria)
  } catch (error) {
    logger.error(`Creating criteria failed: ${error}`)
  }
}

export const saveYearlyCreditCriteria = async (studyProgramme: string, credits: Record<string, string>) => {
  const studyProgrammeToUpdate = await getCriteriaByStudyProgramme(studyProgramme)
  if (!studyProgrammeToUpdate) {
    const courseObj = { year1: [], year2: [], year3: [], year4: [], year5: [], year6: [] }
    const creditsObj = {
      year1: parseInt(credits.year1, 10),
      year2: parseInt(credits.year2, 10),
      year3: parseInt(credits.year3, 10),
      year4: parseInt(credits.year4, 10),
      year5: parseInt(credits.year5, 10),
      year6: parseInt(credits.year6, 10),
    }
    return await createCriteria(studyProgramme, courseObj, creditsObj)
  }
  const yearlyCredits = {
    creditsYearOne: parseInt(credits.year1, 10),
    creditsYearTwo: parseInt(credits.year2, 10),
    creditsYearThree: parseInt(credits.year3, 10),
    creditsYearFour: parseInt(credits.year4, 10),
    creditsYearFive: parseInt(credits.year5, 10),
    creditsYearSix: parseInt(credits.year6, 10),
  }
  try {
    const updatedCriteria = await studyProgrammeToUpdate.update({ ...yearlyCredits })
    return await formatCriteria(updatedCriteria)
  } catch (error) {
    logger.error(`Updating yearly credit criteria failed: ${error}`)
  }
}

export const saveYearlyCourseCriteria = async (studyProgramme: string, courses: string[], year: number) => {
  const studyProgrammeToUpdate = await getCriteriaByStudyProgramme(studyProgramme)
  if (!studyProgrammeToUpdate) {
    const courseObj: Record<string, string[]> = { year1: [], year2: [], year3: [], year4: [], year5: [], year6: [] }
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
    const years = {
      1: 'coursesYearOne',
      2: 'coursesYearTwo',
      3: 'coursesYearThree',
      4: 'coursesYearFour',
      5: 'coursesYearFive',
      6: 'coursesYearSix',
    }

    const yearToUpdate = years[year]
    if (!yearToUpdate) {
      throw new Error(`Invalid year: ${year}`)
    }

    const updatedCriteria = await studyProgrammeToUpdate.update({ [yearToUpdate]: courses })
    return await formatCriteria(updatedCriteria)
  } catch (error) {
    logger.error(`Updating yearly credit criteria failed: ${error}`)
  }
}

export const getCriteria = async (studyProgramme: string) => {
  const studyProgrammeCriteria = await getCriteriaByStudyProgramme(studyProgramme)
  if (studyProgrammeCriteria) {
    return await formatCriteria(studyProgrammeCriteria)
  }
  const emptyCriteria = {
    courses: { yearOne: [], yearTwo: [], yearThree: [], yearFour: [], yearFive: [], yearSix: [] },
    allCourses: [],
    credits: { yearOne: 0, yearTwo: 0, yearThree: 0, yearFour: 0, yearFive: 0, yearSix: 0 },
  }
  return emptyCriteria
}
