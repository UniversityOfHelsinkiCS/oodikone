const Promise = require('bluebird')
const { Op } = require('sequelize')
const { redisClient } = require('../services/redis')
const { Teacher, CourseGroup } = require('../models')

const {
  getCurrentAcademicYear,
  getAcademicYearsFrom,
  getAcademicYearStatistics,
  getTeacherAcademicYearStatisticsByIds,
  getAcademicYearCoursesByTeacherIds
} = require('../models/queries')

// Hard coded teacher ids for demo purposes
const EP_TEACHERS = ['017715', '019051', '053532', '028579', '036199', '083257', '089822', '128474']
const KP_TEACHERS = ['032147', '012926', '066993']

const COURSE_GROUP_NAMES = { 1: 'Erityispedagogiikka', 2: 'Kasvatuspsykologia' }
const ACADEMIC_YEAR_START_SEMESTER = 111 // academic year 2005-06

const COURSE_GROUP_STATISTICS_KEY = 'course_group_statistics'
const COURSE_GROUP_KEY = (groupId, semesterCode) => `course_group_${groupId}_${semesterCode}`
const TEACHER_COURSES_KEY = (teacherId, semesterCode) => `course_group_courses_${teacherId}_${semesterCode}`
const REDIS_CACHE_TTL = 12 * 60 * 60

const getAcademicYears = async () =>
  getAcademicYearsFrom(ACADEMIC_YEAR_START_SEMESTER)

const getCurrentAcademicYearSemesterCode = async () => {
  const academicYear = await getCurrentAcademicYear()
  return academicYear[0].semestercode
}

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

const createCourseGroup = (name) => CourseGroup.create({ name })

const getCourseGroupsWithTotals = async (semesterCode) => {
  const courseGroupIds = [1, 2]
  const cachedStats = await redisClient.getAsync(COURSE_GROUP_STATISTICS_KEY)

  if (cachedStats) {
    return JSON.parse(cachedStats)
  }

  const courseGroupStatistics = await Promise.map(courseGroupIds, async (courseGroupId) => {
    const teacherBasicInfo = await getTeachersForCourseGroup(courseGroupId)

    if (!teacherBasicInfo) {
      return
    }

    const name = COURSE_GROUP_NAMES[courseGroupId]
    const teacherIds = teacherBasicInfo.map(t => t.id)
    const startSemester = semesterCode || await getCurrentAcademicYearSemesterCode()
    const statistics = await getAcademicYearStatistics(teacherIds, startSemester)

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

const getCourseGroup = async (courseGroupId, semesterCode) => {
  const startSemester = semesterCode || await getCurrentAcademicYearSemesterCode()
  const cacheKey = COURSE_GROUP_KEY(courseGroupId, startSemester)
  const cachedCourseGroup = await redisClient.getAsync(cacheKey)

  if (cachedCourseGroup) {
    return JSON.parse(cachedCourseGroup)
  }

  const teacherBasicInfo = await getTeachersForCourseGroup(courseGroupId)

  if (!teacherBasicInfo) {
    return
  }

  const teacherIds = teacherBasicInfo.map(t => t.id)
  const name = COURSE_GROUP_NAMES[courseGroupId]

  const statistics = await getAcademicYearStatistics(teacherIds, startSemester)
  const teacherStats = await getTeacherAcademicYearStatisticsByIds(teacherIds, startSemester)

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
    totalCredits: credits || 0,
    totalStudents: Number(students),
    totalCourses: Number(courses),
    semester: startSemester
  }

  await redisClient.setAsync(cacheKey, JSON.stringify(courseGroup), 'EX', REDIS_CACHE_TTL)

  return courseGroup
}

const getCoursesByTeachers = async (teacherIds, semesterCode) => {
  const startSemester = semesterCode || await getCurrentAcademicYearSemesterCode()
  const cacheKey = TEACHER_COURSES_KEY(teacherIds, startSemester)
  const cachedData = await redisClient.getAsync(cacheKey)

  if (cachedData) {
    return JSON.parse(cachedData)
  }

  const courses = await getAcademicYearCoursesByTeacherIds(teacherIds, startSemester)

  // Sequelize returns credis sums as string
  courses.forEach((course) => {
    course.credits = Number(course.credits)
    course.students = Number(course.students)
  })

  await redisClient.setAsync(cacheKey, JSON.stringify(courses), 'EX', REDIS_CACHE_TTL)

  return courses
}

module.exports = {
  createCourseGroup,
  getAcademicYears,
  getCourseGroupsWithTotals,
  getCourseGroup,
  getCoursesByTeachers
}
