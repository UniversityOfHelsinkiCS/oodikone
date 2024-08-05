/* eslint-disable @typescript-eslint/naming-convention */
import { Op } from 'sequelize'

import { Course, Credit, Semester, Teacher } from '../../models'
import { CreditTypeCode } from '../../types'
import logger from '../../util/logger'
import { redisClient } from '../redis'
import { getCurrentSemester, getSemestersAndYears } from '../semesters'
import { isRegularCourse } from './helpers'

export enum CategoryID {
  ALL = 'all',
  OPEN_UNI = 'openuni',
}

type TeacherStats = { id: string; name: string; passed: number; failed: number; credits: number; transferred: number }

const categories = {
  [CategoryID.ALL]: { name: 'All', redisKey: 'TOP_TEACHERS_ALL_V2' },
  [CategoryID.OPEN_UNI]: { name: 'Open University', redisKey: 'TOP_TEACHERS_OPEN_UNI_V2' },
}

export const getTeacherStats = async (categoryId: string, yearCode: number) => {
  const { redisKey } = categories[categoryId]
  const category = await redisClient.hgetAsync(redisKey, yearCode)
  return JSON.parse(category) || []
}

const setTeacherStats = async (categoryId: string, yearCode: number, stats: TeacherStats[]) => {
  const { redisKey } = categories[categoryId]
  const data = { stats, updated: new Date() }
  await redisClient.hsetAsync(redisKey, yearCode, JSON.stringify(data))
}

export const getCategoriesAndYears = async () => {
  const { years } = await getSemestersAndYears()
  return {
    years: Object.values(years),
    categories: Object.entries(categories).map(([id, { name }]) => ({ id, name })),
  }
}

const getCreditsWithTeachersForYear = async (yearCode: number) => {
  const credits = await Credit.findAll({
    attributes: ['id', 'credits', 'credittypecode', 'isStudyModule', 'is_open'],
    include: [
      {
        model: Semester,
        required: true,
        attributes: [],
        where: {
          yearcode: {
            [Op.eq]: yearCode,
          },
        },
      },
      {
        model: Teacher,
        attributes: ['id', 'name'],
        required: true,
      },
      {
        model: Course,
        attributes: ['code', 'name', 'coursetypecode'],
        required: true,
      },
    ],
  })
  return credits
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
  const stats = teacherStats[id] || { id, name, passed: 0, failed: 0, credits: 0, transferred: 0 }
  if (passed) {
    return {
      ...stats,
      passed: stats.passed + 1,
      credits: transferred ? stats.credits : stats.credits + credits,
      transferred: transferred ? stats.transferred + credits : stats.transferred,
    }
  }
  if (failed) {
    return {
      ...stats,
      failed: stats.failed + 1,
    }
  }
  return stats
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
  const credits = await getCreditsWithTeachersForYear(yearCode)
  const all = {} as Record<string, TeacherStats>
  const openuni = {} as Record<string, TeacherStats>
  credits
    .filter(isRegularCourse)
    .map(credit => {
      const { credits, credittypecode, is_open } = credit
      const teachers = credit.teachers
        .filter(({ id }) => !id.includes('hy-hlo-org')) // Remove faculties from the leaderboards
        .map(({ id, name }) => ({ id, name }))
      const passed = Credit.passed(credit) || Credit.improved(credit)
      const failed = Credit.failed(credit)
      const transferred = credittypecode === CreditTypeCode.APPROVED
      return { passed, failed, credits, teachers, is_open, transferred }
    })
    .forEach(credit => {
      const { passed, failed, credits, teachers, is_open, transferred } = credit
      teachers.forEach(teacher => {
        all[teacher.id] = updatedStats(all, teacher, credits, passed, failed, transferred)
        if (is_open) {
          openuni[teacher.id] = updatedStats(openuni, teacher, credits, passed, failed, transferred)
        }
      })
    })
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

export const findAndSaveTeachers = async (endCode: number, startCode: number = 1) => {
  const endYearCode = endCode || (await getCurrentSemester()).getDataValue('yearcode')
  for (let code = startCode; code <= endYearCode; code++) {
    await findAndSaveTopTeachers(code)
    logger.info(`Teacher leaderboard for yearcode ${code} calculated`)
  }
  logger.info('Teacher leaderboard calculations done')
}
