import { Op } from 'sequelize'

import { ProgressCriteria } from '@oodikone/shared/types'
import { CourseModel } from '../../models'
import { ProgressCriteriaModel } from '../../models/kone'
import logger from '../../util/logger'

type CriteriaWithoutCurriculumVersion = Omit<ProgressCriteriaModel, 'curriculumVersion'>

const getCriteriaByStudyProgramme = async (code: string): Promise<CriteriaWithoutCurriculumVersion | null> =>
  ProgressCriteriaModel.findOne({
    attributes: { exclude: ['curriculumVersion'] },
    where: { code },
  })

/** Construct course_group_id => substitutionGroups object */
const getSubstitutions = async (courseGroupIds: string[]) => {
  const courses: Array<Pick<CourseModel, 'groupId' | 'substitutionGroups' | 'isPrimary'>> = await CourseModel.findAll({
    attributes: ['groupId', 'substitutionGroups', 'isPrimary'],
    where: { groupId: { [Op.in]: courseGroupIds } },
    raw: true,
  })

  // A group can have several rows (one per course code), prefer the primary one
  const substitutionsByGroupId = new Map<string, string[][]>()
  for (const { groupId, substitutionGroups, isPrimary } of courses) {
    if (isPrimary || !substitutionsByGroupId.has(groupId)) {
      substitutionsByGroupId.set(groupId, substitutionGroups)
    }
  }

  // Sort substitutionGroups by length, because (usually) the shortest substitution is the "correct" one
  return Object.fromEntries(
    [...substitutionsByGroupId].map(([groupId, substitutionGroups]) => [
      groupId,
      [...substitutionGroups].sort((a, b) => b.length - a.length),
    ])
  )
}

const formatCriteria = async (criteria: CriteriaWithoutCurriculumVersion | null) => {
  const yearOne = criteria?.courseGroupIdsYearOne ?? []
  const yearTwo = criteria?.courseGroupIdsYearTwo ?? []
  const yearThree = criteria?.courseGroupIdsYearThree ?? []
  const yearFour = criteria?.courseGroupIdsYearFour ?? []
  const yearFive = criteria?.courseGroupIdsYearFive ?? []
  const yearSix = criteria?.courseGroupIdsYearSix ?? []
  const courseGroupIds = [...yearOne, ...yearTwo, ...yearThree, ...yearFour, ...yearFive, ...yearSix]

  const formattedCriteria: ProgressCriteria = {
    allCourseGroups: await getSubstitutions(courseGroupIds),
    courses: { yearOne, yearTwo, yearThree, yearFour, yearFive, yearSix },
    credits: {
      yearOne: criteria?.creditsYearOne ?? 0,
      yearTwo: criteria?.creditsYearTwo ?? 0,
      yearThree: criteria?.creditsYearThree ?? 0,
      yearFour: criteria?.creditsYearFour ?? 0,
      yearFive: criteria?.creditsYearFive ?? 0,
      yearSix: criteria?.creditsYearSix ?? 0,
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
    courseGroupIdsYearOne: courses.year1,
    courseGroupIdsYearTwo: courses.year2,
    courseGroupIdsYearThree: courses.year3,
    courseGroupIdsYearFour: courses.year4,
    courseGroupIdsYearFive: courses.year5,
    courseGroupIdsYearSix: courses.year6,
    creditsYearOne: credits.year1,
    creditsYearTwo: credits.year2,
    creditsYearThree: credits.year3,
    creditsYearFour: credits.year4,
    creditsYearFive: credits.year5,
    creditsYearSix: credits.year6,
  }
  try {
    const createdCriteria = await ProgressCriteriaModel.create(newProgrammeCriteria)
    return await formatCriteria(createdCriteria)
  } catch (error) {
    logger.error(`Creating criteria failed: ${error}`)
    return null
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
    return null
  }
}

export const saveYearlyCourseCriteria = async (studyProgramme: string, courseGroupIds: string[], year: number) => {
  const studyProgrammeToUpdate = await getCriteriaByStudyProgramme(studyProgramme)
  if (!studyProgrammeToUpdate) {
    const courseObj: Record<string, string[]> = { year1: [], year2: [], year3: [], year4: [], year5: [], year6: [] }
    const creditObj = { year1: 0, year2: 0, year3: 0, year4: 0, year5: 0, year6: 0 }
    if (year === 1) {
      courseObj.year1 = courseGroupIds
    } else if (year === 2) {
      courseObj.year2 = courseGroupIds
    } else if (year === 3) {
      courseObj.year3 = courseGroupIds
    } else if (year === 4) {
      courseObj.year4 = courseGroupIds
    } else if (year === 5) {
      courseObj.year5 = courseGroupIds
    } else {
      courseObj.year6 = courseGroupIds
    }
    return await createCriteria(studyProgramme, courseObj, creditObj)
  }

  try {
    const years = {
      1: 'courseGroupIdsYearOne',
      2: 'courseGroupIdsYearTwo',
      3: 'courseGroupIdsYearThree',
      4: 'courseGroupIdsYearFour',
      5: 'courseGroupIdsYearFive',
      6: 'courseGroupIdsYearSix',
    } as const
    if (!(year in years)) {
      throw new Error(`Invalid year: ${year}`)
    }

    const yearToUpdate = years[year as keyof typeof years]

    const updatedCriteria = await studyProgrammeToUpdate.update({ [yearToUpdate]: courseGroupIds })
    return await formatCriteria(updatedCriteria)
  } catch (error) {
    logger.error(`Updating yearly credit criteria failed: ${error}`)
    return null
  }
}

export const getCriteria = async (studyProgramme: string) => {
  const studyProgrammeCriteria = await getCriteriaByStudyProgramme(studyProgramme)

  return await formatCriteria(studyProgrammeCriteria)
}
