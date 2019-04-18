const { redisClient } = require('../services/redis')
const { Teacher, CourseGroup } = require('../models')

const {
  getCurrentAcademicYear,
  getAcademicYearsFrom,
  getAcademicYearStatistics,
  getAcademicYearStatisticsForStudyProgramme,
  getTeacherAcademicYearStatisticsByIds,
  getAcademicYearCoursesByTeacherIds
} = require('../models/queries')

const ACADEMIC_YEAR_START_SEMESTER = 111 // academic year 2005-06

const COURSE_GROUP_STATISTICS_KEY = (programmeId, semesterCode) =>
  `course_group_statistics_${programmeId}_${semesterCode}`
const TEACHER_COURSES_KEY = (teacherId, semesterCode) =>
  `course_group_courses_${teacherId}_${semesterCode}`
const REDIS_CACHE_TTL = 12 * 60 * 60

const getAcademicYears = async () =>
  getAcademicYearsFrom(ACADEMIC_YEAR_START_SEMESTER)

const getCurrentAcademicYearSemesterCode = async () => {
  const academicYear = await getCurrentAcademicYear()
  return academicYear[0].semestercode
}

const getTeachersForCourseGroup = (courseGroupId) => {
  return Teacher.findAll({
    attributes: ['name', 'code', 'id'],
    include: {
      model: CourseGroup,
      attributes: [],
      required: true,
      where: {
        id: courseGroupId
      },
    },
  })
}

const createCourseGroup = (name) => CourseGroup.create({ name })

const getCourseGroupsWithTotals = async (programmeId, semesterCode, forceRefresh = false) => {
  if (!forceRefresh) {
    const cachedStats = await redisClient.getAsync(COURSE_GROUP_STATISTICS_KEY(programmeId, semesterCode))
    if (cachedStats) {
      return JSON.parse(cachedStats)
    }
  }
  const startSemester = semesterCode || await getCurrentAcademicYearSemesterCode()
  const result = await getAcademicYearStatisticsForStudyProgramme(programmeId, startSemester)

  await redisClient.setAsync(
    COURSE_GROUP_STATISTICS_KEY(programmeId, semesterCode),
    JSON.stringify(result),
    'EX',
    6*4*7*24*60*60 // 6 months in seconds
  )
  return result
}

const getCourseGroup = async (courseGroupId, semesterCode) => {
  const startSemester = semesterCode || await getCurrentAcademicYearSemesterCode()
  const teacherBasicInfo = await getTeachersForCourseGroup(courseGroupId)
  const courseGroup = await CourseGroup.findByPk(courseGroupId)

  if (!courseGroup) return
  if (!teacherBasicInfo) return

  if (teacherBasicInfo.length === 0) {
    return {
      id: courseGroupId,
      name: courseGroup.name,
      teachers: [],
      totalCredits: 0,
      totalStudents: 0,
      totalCourses: 0,
      semester: startSemester
    }
  }

  const teacherIds = teacherBasicInfo.map(t => t.id)
  const statistics = await getAcademicYearStatistics(teacherIds, startSemester)
  const teacherStats = await getTeacherAcademicYearStatisticsByIds(teacherIds, startSemester)

  const { credits, students, courses } = statistics[0]

  const mergedTeachers = [...teacherBasicInfo.map(e => e.get()), ...teacherStats]
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

  const courseGroupInfo = {
    id: courseGroupId,
    name: courseGroup.name,
    teachers,
    totalCredits: credits || 0,
    totalStudents: Number(students),
    totalCourses: Number(courses),
    semester: startSemester
  }

  return courseGroupInfo
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

const addTeacher = async (courseGroupId, teacherid) => {
  const group = await CourseGroup.findByPk(courseGroupId)
  const teacher = await Teacher.findByPk(teacherid)
  if (!group || !teacher) return
  return await group.addTeacher(teacher)
}

const removeTeacher = async (courseGroupId, teacherid) => {
  const group = await CourseGroup.findByPk(courseGroupId)
  const teacher = await Teacher.findByPk(teacherid)
  if (!group || !teacher) return
  return await group.removeTeacher(teacher)
}

module.exports = {
  createCourseGroup,
  getAcademicYears,
  getCourseGroupsWithTotals,
  getCourseGroup,
  getCoursesByTeachers,
  addTeacher,
  removeTeacher
}
