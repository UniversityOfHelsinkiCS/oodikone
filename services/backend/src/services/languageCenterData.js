import { orderBy } from 'lodash-es'
import { Op } from 'sequelize'

import { CourseModel, CreditModel, EnrollmentModel, SISStudyRightModel } from '../models'
import { redisClient } from './redis'

export const LANGUAGE_CENTER_REDIS_KEY = 'LANGUAGE_CENTER_DATA'

const isBetween = (start, date, end) => {
  return new Date(start).getTime() <= new Date(date).getTime() && new Date(date).getTime() <= new Date(end).getTime()
}

const findStudyRight = (studyRights, date) => {
  return studyRights?.find(studyRight => isBetween(studyRight.startDate, date, studyRight.endDate))
}

const getDifference = stats => {
  const difference = stats.enrollments - stats.completions
  if (difference < 0) {
    return 0
  }
  return difference
}

const getLanguageCenterCourses = async () => {
  const courses = await CourseModel.findAll({
    attributes: ['code', 'name'],
    where: {
      [Op.or]: [{ code: { [Op.like]: 'KK%' } }, { code: { [Op.like]: 'AYKK%' } }],
    },
    raw: true,
  })
  return courses
}

export const createArrayOfCourses = async (attempts, courses) => {
  const fields = { completions: 0, enrollments: 0, difference: 0, rejected: 0 }
  const semesters = {}
  const faculties = {}
  const semesterStatsMap = attempts.reduce((obj, cur) => {
    const semester = cur.semestercode
    faculties[cur.faculty] = true
    semesters[semester] = true
    if (!obj[cur.courseCode]) {
      obj[cur.courseCode] = {}
    }
    if (!obj[cur.courseCode][semester]) {
      obj[cur.courseCode][semester] = { ...fields }
    }
    if (cur.faculty && !obj[cur.courseCode][semester][cur.faculty]) {
      obj[cur.courseCode][semester][cur.faculty] = { ...fields }
    }
    const allFacultiesTotal = obj[cur.courseCode][semester]
    const allStats = [allFacultiesTotal]
    if (cur.faculty) {
      const semesterFacultyStats = obj[cur.courseCode][semester][cur.faculty]
      allStats.push(semesterFacultyStats)
    }
    for (const stats of allStats) {
      if (cur.completed) {
        stats.completions += 1
      } else if (cur.enrolled) {
        stats.enrollments += 1
      } else {
        stats.rejected += 1
      }
    }
    return obj
  }, {})

  const courseList = courses
    .map(course => ({ ...course, bySemesters: { ...semesterStatsMap[course.code], cellStats: {} } }))
    .filter(course => course.bySemesters)

  courseList.forEach(course => {
    Object.keys(semesters).forEach(semester => {
      const stats = course.bySemesters[semester]
      if (!stats) return
      stats.difference = getDifference(stats)
      Object.keys(faculties).forEach(faculty => {
        const stats = course.bySemesters[semester]?.[faculty]
        if (!stats) return
        stats.difference = getDifference(stats)
      })
    })
  })

  return courseList
}

export const computeLanguageCenterData = async () => {
  const courses = await getLanguageCenterCourses()
  const autumnSemester2017 = 135

  const credits = await CreditModel.findAll({
    attributes: ['course_code', 'student_studentnumber', 'semestercode', 'attainment_date', 'studyright_id'],
    where: {
      [Op.or]: [{ course_code: { [Op.like]: 'KK%' } }, { course_code: { [Op.like]: 'AYKK%' } }],
      semestercode: { [Op.gte]: autumnSemester2017 },
      credittypecode: 4,
    },
    raw: true,
  })

  const enrollments = await EnrollmentModel.findAll({
    attributes: ['studentnumber', 'semestercode', 'course_code', 'enrollment_date_time', 'studyright_id', 'state'],
    where: {
      [Op.or]: [{ course_code: { [Op.like]: 'KK%' } }, { course_code: { [Op.like]: 'AYKK%' } }],
      semestercode: { [Op.gte]: autumnSemester2017 },
      state: { [Op.in]: ['ENROLLED', 'REJECTED'] },
    },
    raw: true,
  })

  const studyRights = await SISStudyRightModel.findAll({ raw: true })

  const attemptStudyRightToFacultyMap = studyRights.reduce((obj, cur) => {
    if (!cur.id) return obj
    obj[cur.id] = cur.facultyCode
    return obj
  }, {})

  credits.forEach(credit => {
    credit.faculty = attemptStudyRightToFacultyMap[credit.studyright_id]
  })

  enrollments.forEach(enrollment => {
    enrollment.faculty = attemptStudyRightToFacultyMap[enrollment.studyright_id]
  })

  const studentNumbers = new Set()
  const attemptsByStudents = {}

  credits.forEach(credit => {
    const studentNumber = credit.student_studentnumber
    studentNumbers.add(studentNumber)
    if (!attemptsByStudents[studentNumber]) {
      attemptsByStudents[studentNumber] = []
    }
    attemptsByStudents[studentNumber].push({
      studentNumber,
      courseCode: credit.course_code,
      completed: true,
      date: credit.attainment_date,
      faculty: attemptStudyRightToFacultyMap[credit.studyright_id],
      semestercode: credit.semestercode,
    })
  })

  enrollments.forEach(enrollment => {
    const studentNumber = enrollment.studentnumber
    if (!attemptsByStudents[studentNumber]) {
      attemptsByStudents[studentNumber] = []
    }
    studentNumbers.add(studentNumber)
    if (
      attemptsByStudents[studentNumber].find(
        attempt =>
          !attempt.completed &&
          attempt.semestercode === enrollment.semestercode &&
          attempt.courseCode === enrollment.course_code
      )
    ) {
      return
    }
    attemptsByStudents[studentNumber].push({
      studentNumber,
      courseCode: enrollment.course_code,
      completed: false,
      date: enrollment.enrollment_date_time,
      faculty: attemptStudyRightToFacultyMap[enrollment.studyright_id],
      semestercode: enrollment.semestercode,
      enrolled: enrollment.state === 'ENROLLED',
    })
  })

  const studentNumberToStudyRightsMap = studyRights.reduce((obj, cur) => {
    if (!obj[cur.studentNumber]) obj[cur.studentNumber] = []
    obj[cur.studentNumber].push(cur)
    return obj
  }, {})

  const attempts = []
  studentNumbers.forEach(studentNumber => attempts.push(...attemptsByStudents[studentNumber]))
  // 93033 Avoin yliopisto, yhteistyöoppilaitokset
  // 93034 Kesäyliopistot
  const isOpenUni = facultyCode => ['9301', 'H930', '93033', '93034'].includes(facultyCode)
  const isMisc = facultyCode => ['H906', 'H401'].includes(facultyCode) // Language center, Alexander institute (very few numbers)
  const isHyFaculty = facultyCode => facultyCode.substring(0, 3).match('^H\\d')

  attempts.forEach(attempt => {
    if (attempt.faculty) {
      if (isOpenUni(attempt.faculty)) {
        attempt.faculty = 'OPEN'
      } else if (isMisc(attempt.faculty) || !isHyFaculty(attempt.faculty)) {
        attempt.faculty = 'OTHER'
      }
      return
    }

    const facultyCode = findStudyRight(studentNumberToStudyRightsMap[attempt.studentNumber], attempt.date)?.facultyCode
    if (!facultyCode) {
      attempt.faculty = 'OTHER'
    } else if (isOpenUni(facultyCode)) {
      attempt.faculty = 'OPEN'
    } else if (isHyFaculty(facultyCode) && !isMisc(facultyCode)) {
      attempt.faculty = facultyCode
    } else {
      attempt.faculty = 'OTHER'
    }
  })

  const unorderedTableData = await createArrayOfCourses(attempts, courses)
  const tableData = orderBy(unorderedTableData, 'code')

  const faculties = [...new Set(attempts.map(({ faculty }) => faculty))]

  return { tableData, faculties }
}

export const getLanguageCenterData = async () => {
  const dataOnRedis = await redisClient.get(LANGUAGE_CENTER_REDIS_KEY)
  if (dataOnRedis) return JSON.parse(dataOnRedis)
  const freshData = await computeLanguageCenterData()
  await redisClient.set(LANGUAGE_CENTER_REDIS_KEY, JSON.stringify(freshData))
  return freshData
}
