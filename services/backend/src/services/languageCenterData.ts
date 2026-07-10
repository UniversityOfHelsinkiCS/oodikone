import { orderBy } from 'lodash-es'
import { Op } from 'sequelize'

import { EnrollmentState } from '@oodikone/shared/types'
import { CourseModel, CreditModel, EnrollmentModel, SISStudyRightModel } from '../models'
import { redisClient } from './redis'

export const LANGUAGE_CENTER_REDIS_KEY = 'LANGUAGE_CENTER_DATA'

const isBetween = (start: Date, date: Date, end: Date) => {
  return new Date(start).getTime() <= new Date(date).getTime() && new Date(date).getTime() <= new Date(end).getTime()
}

/** Assumes studyrights are in correct order */
const findStudyRight = (studyRights: SISStudyRightModel[], date: Date) => {
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
  const courses: Pick<CourseModel, 'code' | 'name'>[] = await CourseModel.findAll({
    attributes: ['code', 'name'],
    where: {
      [Op.or]: [{ code: { [Op.like]: 'KK%' } }, { code: { [Op.like]: 'AYKK%' } }],
    },
    raw: true,
  })
  return courses
}

export const createArrayOfCourses = (attempts: Attempt[], courses: Pick<CourseModel, 'code' | 'name'>[]) => {
  const fields = { completions: 0, enrollments: 0, difference: 0, rejected: 0 }
  const semesters: Record<Attempt['semestercode'], boolean> = {}
  // Remove undefined as a possibility for type
  const faculties: Record<Exclude<Attempt['faculty'], undefined>, boolean> = {}

  // TODO: Type this properly. Good luck :)
  const semesterStatsMap = attempts.reduce((acc, cur) => {
    const semester = cur.semestercode
    if (cur.faculty) {
      faculties[cur.faculty] = true
    }
    semesters[semester] = true

    acc[cur.courseCode] ??= {}
    // NOTE: This has to be spread because otherwise a ref to fields is saved to
    // acc[cur.courseCode][semester] which would in the end result in a massive circular object
    acc[cur.courseCode][semester] ??= { ...fields }

    if (cur.faculty) {
      acc[cur.courseCode][semester][cur.faculty] ??= { ...fields }
    }

    const allFacultiesTotal = acc[cur.courseCode][semester]
    const allStats = [allFacultiesTotal]

    if (cur.faculty) {
      const semesterFacultyStats = acc[cur.courseCode][semester][cur.faculty]
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
    return acc
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

type Attempt = {
  studentNumber: string
  courseCode: string
  completed: boolean
  date: Date
  semestercode: number
  faculty?: string
  enrolled?: boolean
}

export const computeLanguageCenterData = async () => {
  const courses = await getLanguageCenterCourses()
  const autumnSemester2017 = 135

  const credits = await CreditModel.findAll({
    raw: true,
    attributes: ['course_code', 'student_studentnumber', 'semestercode', 'attainment_date', 'studyright_id'],
    where: {
      [Op.or]: [{ course_code: { [Op.like]: 'KK%' } }, { course_code: { [Op.like]: 'AYKK%' } }],
      semestercode: { [Op.gte]: autumnSemester2017 },
      credittypecode: 4,
    },
  })

  const enrollments = await EnrollmentModel.findAll({
    raw: true,
    attributes: ['studentnumber', 'semestercode', 'course_code', 'enrollment_date_time', 'studyright_id', 'state'],
    where: {
      [Op.or]: [{ course_code: { [Op.like]: 'KK%' } }, { course_code: { [Op.like]: 'AYKK%' } }],
      state: { [Op.in]: ['ENROLLED', 'REJECTED'] },
      // EnrollmentDateTimeThreshold need not be used here as we are not counting failed courses
    },
  })

  const studyRights = await SISStudyRightModel.findAll({
    raw: true,
    order: [['end_date', 'DESC']],
  })

  const attemptStudyRightToFacultyMap = studyRights.reduce<
    Record<SISStudyRightModel['id'], SISStudyRightModel['facultyCode']>
  >((acc, cur) => {
    if (!cur.id) return acc
    acc[cur.id] = cur.facultyCode
    return acc
  }, {})

  const studentNumbers = new Set<string>()
  const attemptsByStudents: Record<string, Attempt[]> = {}

  credits.forEach(credit => {
    const studentNumber = credit.student_studentnumber
    studentNumbers.add(studentNumber)
    attemptsByStudents[studentNumber] ??= []
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
    studentNumbers.add(studentNumber)
    attemptsByStudents[studentNumber] ??= []
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
      enrolled: enrollment.state === EnrollmentState.ENROLLED,
    })
  })

  const studentNumberToStudyRightsMap = studyRights.reduce<
    Record<SISStudyRightModel['studentNumber'], SISStudyRightModel[]>
  >((acc, cur) => {
    acc[cur.studentNumber] ??= []
    acc[cur.studentNumber].push(cur)
    return acc
  }, {})

  const attempts: Attempt[] = []
  studentNumbers.forEach(studentNumber => attempts.push(...attemptsByStudents[studentNumber]))
  // 93033 Avoin yliopisto, yhteistyöoppilaitokset
  // 93034 Kesäyliopistot
  const isOpenUni = (facultyCode: string) => ['9301', 'H930', '93033', '93034'].includes(facultyCode)
  const isMisc = (facultyCode: string) => ['H906', 'H401'].includes(facultyCode) // Language center, Alexander institute (very few numbers)
  const isHyFaculty = (facultyCode: string) => /^H\d/.exec(facultyCode.substring(0, 3))

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

  const unorderedTableData = createArrayOfCourses(attempts, courses)
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
