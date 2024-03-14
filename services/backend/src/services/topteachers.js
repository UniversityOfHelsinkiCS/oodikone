const { redisClient } = require('./redis')
const { getSemestersAndYears, getCurrentSemester } = require('./semesters')
const { Teacher, Semester, Credit, Course } = require('../models')
const { Op } = require('sequelize')
const logger = require('../util/logger')

const category = (name, rediskey) => ({ name, rediskey })

const ID = {
  ALL: 'all',
  OPENUNI: 'openuni',
}

const categories = {
  [ID.ALL]: category('All', 'TOP_TEACHERS_ALL_V2'),
  [ID.OPENUNI]: category('Open University', 'TOP_TEACHERS_OPEN_UNI_V2'),
}

const deleteCategory = async categoryid => {
  const { rediskey } = categories[categoryid]
  await redisClient.delAsync(rediskey)
}

const getTeacherStats = async (categoryid, yearcode) => {
  const { rediskey } = categories[categoryid]
  const category = await redisClient.hgetAsync(rediskey, yearcode)
  return JSON.parse(category) || []
}

const setTeacherStats = async (categoryid, yearcode, stats) => {
  const { rediskey } = categories[categoryid]
  const data = { stats, updated: new Date() }
  await redisClient.hsetAsync(rediskey, yearcode, JSON.stringify(data))
}

const getCategoriesAndYears = async () => {
  const { years } = await getSemestersAndYears(new Date())
  return {
    years: Object.values(years),
    categories: Object.entries(categories).map(([id, { name }]) => ({ id, name })),
  }
}

const creditsWithTeachersForYear = yearcode =>
  Credit.findAll({
    attributes: ['id', 'credits', 'credittypecode', 'isStudyModule', 'is_open'],
    include: [
      {
        model: Semester,
        required: true,
        attributes: [],
        where: {
          yearcode: {
            [Op.eq]: yearcode,
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

const updatedStats = (statistics, teacher, passed, failed, credits, transferred) => {
  const { id, name } = teacher
  const stats = statistics[id] || { id, name, passed: 0, failed: 0, credits: 0, transferred: 0 }
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

const isRegularCourse = credit => !credit.isStudyModule

const filterTopTeachers = (stats, limit = 50) =>
  Object.values(stats)
    .sort((t1, t2) => t2.credits - t1.credits)
    .slice(0, limit)
    .map(({ credits, ...rest }) => ({
      ...rest,
      credits: Math.floor(credits),
    }))

const findTopTeachers = async yearcode => {
  const credits = await creditsWithTeachersForYear(yearcode)
  const all = {}
  const openuni = {}
  credits
    .filter(isRegularCourse)
    .map(credit => {
      const { credits, credittypecode, is_open } = credit
      const teachers = credit.teachers
        .filter(({ id }) => !id.includes('hy-hlo-org')) // Remove faculties from the leaderboards
        .map(({ id, name }) => ({ id, name }))
      const passed = Credit.passed(credit) || Credit.improved(credit)
      const failed = Credit.failed(credit)
      const transferred = credittypecode === 9
      return { passed, failed, credits, teachers, is_open, transferred }
    })
    .forEach(credit => {
      const { passed, failed, credits, teachers, is_open, transferred } = credit
      teachers.forEach(teacher => {
        all[teacher.id] = updatedStats(all, teacher, passed, failed, credits, transferred)
        if (is_open) {
          openuni[teacher.id] = updatedStats(openuni, teacher, passed, failed, credits, transferred)
        }
      })
    })
  return {
    all: filterTopTeachers(all),
    openuni: filterTopTeachers(openuni),
  }
}

const findAndSaveTopTeachers = async yearcode => {
  const { all, openuni } = await findTopTeachers(yearcode)
  await setTeacherStats(ID.OPENUNI, yearcode, openuni)
  await setTeacherStats(ID.ALL, yearcode, all)
}

const findAndSaveTeachers = async (startcode = 1, to) => {
  const endcode = to || (await getCurrentSemester()).getDataValue('yearcode')
  for (let code = startcode; code <= endcode; code++) {
    await findAndSaveTopTeachers(code)
    logger.info(`Teacher leaderboard for yearcode ${code} calculated`)
  }
  logger.info('Teacher leaderboard calculations done')
}

module.exports = {
  deleteCategory,
  getTeacherStats,
  setTeacherStats,
  getCategoriesAndYears,
  findTopTeachers,
  findAndSaveTeachers,
  findAndSaveTopTeachers,
  ID,
}
