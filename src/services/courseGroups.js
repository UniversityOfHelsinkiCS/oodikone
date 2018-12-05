const Promise = require('bluebird')
const { Op } = require('sequelize')
const { sequelize } = require('../database/connection')
const { redisClient } = require('../services/redis')
const { Teacher } = require('../models')

// Hard coded teacher ids for demo purposes
const EP_TEACHERS = ['017715', '019051', '053532', '028579', '036199', '083257', '089822', '128474']
const KP_TEACHERS = ['032147', '012926', '066993']

const COURSE_GROUP_NAMES = { 1: 'Erityispedagogiikka', 2: 'Kasvatuspsykologia' }
const STATISTICS_START_SEMESTER = 135

const COURSE_GROUP_STATISTICS_KEY = 'course_group_statistics'
const COURSE_GROUP_KEY = groupId => `course_group_${groupId}`
const TEACHER_COURSES_KEY = teacherId => `course_group_courses_${teacherId}`
const REDIS_CACHE_TTL = 12 * 60 * 60


const getTeachersForCourseGroup = (courseGroupId) => {
  const validCourseGroupIds = [1, 2]
  if (!validCourseGroupIds.includes(courseGroupId)) {
    return undefined
  }

  let teacherIds
  if (courseGroupId === 1) {
    teacherIds = EP_TEACHERS
  }

  if (courseGroupId === 2) {
    teacherIds = KP_TEACHERS
  }

  return Teacher.findAll({
    raw: true,
    attributes: ['name', 'code', 'id'],
    where: {
      id: {
        [Op.in]: teacherIds
      }
    }
  })
}

const getCourseGroupInfoByTeacherIds = teacherIds => sequelize.query(
  `select
        count(distinct c.course_code) as courses,
        sum(credits) as credits,
        count(distinct student_studentnumber) as students
      from credit_teachers ct
        left join credit c on ct.credit_id = c.id
      where
        ct.teacher_id in (:teacherIds)
      and
        c.semestercode >= ${STATISTICS_START_SEMESTER}`,
  { replacements: { teacherIds }, type: sequelize.QueryTypes.SELECT }
)

const getCourseGroupsWithTotals = async () => {
  const courseGroupIds = [1, 2]
  const cachedStats = await redisClient.getAsync(COURSE_GROUP_STATISTICS_KEY)

  if (cachedStats) {
    return JSON.parse(cachedStats)
  }

  const courseGroupStatistics = await Promise.map(courseGroupIds, async (courseGroupId) => {
    const teacherBasicInfos = await getTeachersForCourseGroup(courseGroupId)

    if (!teacherBasicInfos) {
      return
    }

    const name = COURSE_GROUP_NAMES[courseGroupId]
    const teacherIds = teacherBasicInfos.map(t => t.id)
    const statistics = await getCourseGroupInfoByTeacherIds(teacherIds)

    return {
      id: courseGroupId,
      name,
      credits: statistics[0].credits,
      students: Number(statistics[0].students)
    }
  })

  await redisClient.setAsync(COURSE_GROUP_STATISTICS_KEY, JSON.stringify(courseGroupStatistics), 'EX', REDIS_CACHE_TTL)

  return courseGroupStatistics
}

const getTeacherStatisticsByIds = async teacherIds => sequelize.query(
  `select
        ct.teacher_id as id,       
        count(distinct c.course_code) as courses,
        sum(credits) as credits,
        count(distinct student_studentnumber) as students
      from credit_teachers ct
        left join credit c on ct.credit_id = c.id       
      where
        semestercode >= ${STATISTICS_START_SEMESTER}
      and
        ct.teacher_id in (:teacherIds)
      group by ct.teacher_id`,
  { replacements: { teacherIds }, type: sequelize.QueryTypes.SELECT }
)

const getCourseGroup = async (courseGroupId) => {
  const cachedCourseGroup = await redisClient.getAsync(COURSE_GROUP_KEY(courseGroupId))

  if (cachedCourseGroup) {
    return JSON.parse(cachedCourseGroup)
  }

  const teacherBasicInfo = await getTeachersForCourseGroup(courseGroupId)

  if (!teacherBasicInfo) {
    return
  }
  const teacherIds = teacherBasicInfo.map(t => t.id)
  const name = COURSE_GROUP_NAMES[courseGroupId]
  const statistics = await getCourseGroupInfoByTeacherIds(teacherIds)
  const teacherStats = await getTeacherStatisticsByIds(teacherIds)

  const { credits, students, courses } = statistics[0]

  const mergedTeachers = [...teacherBasicInfo, ...teacherStats]
    .reduce((acc, cur) => {
      if (acc[cur.id]) {
        acc[cur.id] = { ...cur, ...acc[cur.id] }
      } else {
        acc[cur.id] = cur
      }
      return acc
    }, {})

  const teachers = Object.values(mergedTeachers)
    .map(t => ({
      ...t,
      courses: t.courses ? Number(t.courses) : 0,
      credits: t.credits ? Number(t.credits) : 0,
      students: t.students ? Number(t.students) : 0

    }))

  const courseGroup = {
    id: courseGroupId,
    name,
    teachers,
    totalCredits: credits,
    totalStudents: students,
    totalCourses: courses
  }

  await redisClient.setAsync(COURSE_GROUP_KEY(courseGroupId), JSON.stringify(courseGroup), 'EX', REDIS_CACHE_TTL)

  return courseGroup
}

const getCoursesByTeachers = async (teacherIds) => {
  const cachedData = await redisClient.getAsync(TEACHER_COURSES_KEY(teacherIds))

  if (cachedData) {
    return JSON.parse(cachedData)
  }

  const courses = await sequelize.query(
    `select
          course_code as coursecode,
          co.name as coursenames,
          t.code as teachercode,
          t.name as teachername,
          sum(credits) as credits,
          count(distinct student_studentnumber) as students
        from credit_teachers ct
          left join credit c on ct.credit_id = c.id
          left join teacher t on ct.teacher_id = t.id
          left join course co on c.course_code = co.code
        where
          semestercode >= ${STATISTICS_START_SEMESTER}
        and
          ct.teacher_id in (:teacherIds)
        group by course_code, t.name, t.code, co.name`,
    { replacements: { teacherIds }, type: sequelize.QueryTypes.SELECT }
  )

  // Sequelize returns credis sums as string
  courses.forEach((course) => {
    course.credits = Number(course.credits)
    course.students = Number(course.students)
  })

  await redisClient.setAsync(TEACHER_COURSES_KEY(teacherIds), JSON.stringify(courses), 'EX', REDIS_CACHE_TTL)

  return courses
}

module.exports = {
  getTeachersForCourseGroup,
  getCourseGroupsWithTotals,
  getCourseGroup,
  getCoursesByTeachers
}
