const Promise = require('bluebird')
const { Op } = require('sequelize')
const { sequelize } = require('../database/connection')
const { redisClient } = require('../services/redis')
const { Teacher } = require('../models')

// Hard coded teacher ids for demo purposes
const EP_TEACHERS = ['017715', '019051', '053532', '028579', '036199', '083257', '089822', '128474']
const KP_TEACHERS = ['032147', '012926', '066993']

const COURSE_GROUP_NAMES = { 1: 'Erityispedagogiikka', 2: 'Kasvatuspsykologia' }
const ACADEMIC_YEAR_START_SEMESTER = 111 // academic year 2005-06

const COURSE_GROUP_STATISTICS_KEY = 'course_group_statistics'
const COURSE_GROUP_KEY = (groupId, semesterCode) => `course_group_${groupId}_${semesterCode}`
const TEACHER_COURSES_KEY = (teacherId, semesterCode) => `course_group_courses_${teacherId}_${semesterCode}`
const REDIS_CACHE_TTL = 12 * 60 * 60


const getAcademicYears = () => sequelize.query(
  `select 
      distinct on (yearname) yearname, 
      semestercode 
    from semesters 
    where semestercode >= ${ACADEMIC_YEAR_START_SEMESTER}
      order by yearname, semestercode`,
  { type: sequelize.QueryTypes.SELECT }
)

const getCurrentAcademicYear = () => sequelize.query(
  `select 
      semestercode, 
      startdate, 
      yearname 
    from semesters 
      where startdate <= now() 
      and date_part('month', startdate) = 7 
    order by startdate desc 
    fetch first row only`,
  { type: sequelize.QueryTypes.SELECT }
)

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

const getCourseGroupInfoByTeacherIds = (teacherIds, startSemester) => {
  const endSemester = startSemester + 1
  return sequelize.query(
    `select
        count(distinct c.course_code) as courses,
        sum(credits) as credits,
        count(distinct student_studentnumber) as students
      from credit_teachers ct
        left join credit c on ct.credit_id = c.id
      where
        ct.teacher_id in (:teacherIds)
      and
        c.semestercode >= :startSemester
      and 
        c.semestercode <= :endSemester`,
    { replacements: { teacherIds, startSemester, endSemester },
      type: sequelize.QueryTypes.SELECT }
  )
}

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
    const statistics = await getCourseGroupInfoByTeacherIds(teacherIds, startSemester)

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

const getTeacherStatisticsByIds = (teacherIds, startSemester) => {
  const endSemester = startSemester + 1
  return sequelize.query(
    `select
        ct.teacher_id as id,       
        count(distinct c.course_code) as courses,
        sum(credits) as credits,
        count(distinct student_studentnumber) as students
      from credit_teachers ct
        left join credit c on ct.credit_id = c.id       
      where      
        c.semestercode >= :startSemester
      and 
        c.semestercode <= :endSemester 
      and
        ct.teacher_id in (:teacherIds)
      group by ct.teacher_id`,
    { replacements: { teacherIds, startSemester, endSemester },
      type: sequelize.QueryTypes.SELECT }
  )
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

  const statistics = await getCourseGroupInfoByTeacherIds(teacherIds, startSemester)
  const teacherStats = await getTeacherStatisticsByIds(teacherIds, startSemester)

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
    totalStudents: Number(students),
    totalCourses: Number(courses)
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

  const endSemester = startSemester + 1
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
          c.semestercode >= :startSemester
        and 
          c.semestercode <= :endSemester 
        and
          ct.teacher_id in (:teacherIds)
        group by course_code, t.name, t.code, co.name`,
    { replacements: { teacherIds, startSemester, endSemester },
      type: sequelize.QueryTypes.SELECT }
  )

  // Sequelize returns credis sums as string
  courses.forEach((course) => {
    course.credits = Number(course.credits)
    course.students = Number(course.students)
  })

  await redisClient.setAsync(cacheKey, JSON.stringify(courses), 'EX', REDIS_CACHE_TTL)

  return courses
}

module.exports = {
  getAcademicYears,
  getTeachersForCourseGroup,
  getCourseGroupsWithTotals,
  getCourseGroup,
  getCoursesByTeachers
}
