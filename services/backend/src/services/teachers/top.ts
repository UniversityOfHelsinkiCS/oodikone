import { col, Op } from 'sequelize'

import { Credit, Semester, Teacher } from '../../models'
import { CreditTypeCode } from '../../types'
import logger from '../../util/logger'
import { redisClient } from '../redis'
import { getCurrentSemester, getSemestersAndYears } from '../semesters'
import { TeacherStats } from './helpers'

export enum CategoryID {
  ALL = 'all',
  OPEN_UNI = 'openuni',
}

const categories = {
  [CategoryID.ALL]: { name: 'All', redisKey: 'TOP_TEACHERS_ALL_V2' },
  [CategoryID.OPEN_UNI]: { name: 'Open University', redisKey: 'TOP_TEACHERS_OPEN_UNI_V2' },
}

export const getTeacherStats = async (categoryId: string, yearCode: number) => {
  const { redisKey } = categories[categoryId]
  const category = await redisClient.hGet(redisKey, `${yearCode}`)
  return category ? JSON.parse(category) : null
}

const setTeacherStats = async (categoryId: string, yearCode: number, stats: TeacherStats[]) => {
  const { redisKey } = categories[categoryId]
  const data = { stats, updated: new Date() }
  await redisClient.hSet(redisKey, yearCode, JSON.stringify(data))
}

export const getCategoriesAndYears = async () => {
  const { years } = await getSemestersAndYears()
  return {
    years: Object.values(years),
    categories: Object.entries(categories).map(([id, { name }]) => ({ id, name })),
  }
}

const getCreditsWithTeachersForYear = async (semesters: string[]) => {
  const credits = await Credit.findAll({
    attributes: [
      'credits',
      'credittypecode',
      'isStudyModule',
      'is_open',
      [col('teachers.id'), 'teacherId'],
      [col('teachers.name'), 'teacherName'],
    ],
    include: {
      model: Teacher,
      through: {
        attributes: [],
      },
      attributes: [],
      where: {
        id: {
          [Op.notLike]: 'hy-hlo-org%',
        },
      },
    },
    where: {
      semester_composite: {
        [Op.in]: semesters,
      },
    },
    raw: true,
  })
  return credits as unknown as Array<
    Pick<Credit, 'credits' | 'credittypecode' | 'isStudyModule' | 'is_open'> & {
      teacherId: string
      teacherName: string
    }
  >
}

const updatedStats = (
  teacherStats: Record<string, TeacherStats>,
  teacher: { id: string; name: string },
  credits: number,
  passed: boolean,
  failed: boolean,
  transferred: boolean
) => {
  const { id, name } = teacher
  if (!teacherStats[id]) {
    teacherStats[id] = { id, name, passed: 0, failed: 0, credits: 0, transferred: 0 }
  }
  const stats = teacherStats[id]
  if (passed) {
    stats.passed += 1
    stats.credits = transferred ? stats.credits : stats.credits + credits
    stats.transferred = transferred ? stats.transferred + credits : stats.transferred
  } else if (failed) {
    stats.failed += 1
  }
}

const filterTopTeachers = (stats: Record<string, TeacherStats>, limit: number = 50) => {
  return Object.values(stats)
    .sort((t1, t2) => t2.credits - t1.credits)
    .slice(0, limit)
    .map(({ credits, ...rest }) => ({
      ...rest,
      credits: Math.floor(credits),
    }))
}

const findTopTeachers = async (yearCode: number) => {
  const semesters = (
    await Semester.findAll({
      where: {
        yearcode: yearCode,
      },
      attributes: ['composite'],
    })
  ).map(({ composite }) => composite)
  const credits = await getCreditsWithTeachersForYear(semesters)
  const all: Record<string, TeacherStats> = {}
  const openuni: Record<string, TeacherStats> = {}
  for (const credit of credits) {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { credits, credittypecode, isStudyModule, is_open, teacherId, teacherName } = credit
    if (isStudyModule) continue
    const passed = Credit.passed(credit) || Credit.improved(credit)
    const failed = Credit.failed(credit)
    const transferred = credittypecode === CreditTypeCode.APPROVED
    const teacher = { id: teacherId, name: teacherName }
    updatedStats(all, teacher, credits, passed, failed, transferred)
    if (is_open) {
      updatedStats(openuni, teacher, credits, passed, failed, transferred)
    }
  }
  return {
    all: filterTopTeachers(all),
    openuni: filterTopTeachers(openuni),
  }
}

const findAndSaveTopTeachers = async (yearCode: number) => {
  const { all, openuni } = await findTopTeachers(yearCode)
  await setTeacherStats(CategoryID.OPEN_UNI, yearCode, openuni)
  await setTeacherStats(CategoryID.ALL, yearCode, all)
}

export const findAndSaveTeachers = async (endCode?: number, startCode: number = 1) => {
  const endYearCode = endCode ?? (await getCurrentSemester()).getDataValue('yearcode')
  for (let code = startCode; code <= endYearCode; code++) {
    await findAndSaveTopTeachers(code)
    logger.info(`Teacher leaderboard for yearcode ${code} calculated`)
  }
  logger.info('Teacher leaderboard calculations done')
}
