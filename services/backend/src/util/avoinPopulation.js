/* eslint-disable */

const { Credit, Enrollment, Studyright } = require('../models')
const moment = require('moment')
const { Op } = require('sequelize')

const hasValidStudyright = (studyrights, date) => {
  const within = (right, date) => {
    const first = moment(right.startdate)
    const last = moment(right.enddate)
    return first.isSameOrBefore(date) && last.isSameOrAfter(date)
  }

  return studyrights.find(r => within(r, date))
}

const studyrightsOf = async student => {
  const rights = await Studyright.findAll({
    where: {
      student_studentnumber: student,
    },
  })

  return rights
}

const uniq = objects => [...new Set(objects)]

const courseInfo = async course_code => {
  const credits = await Credit.findAll({
    where: {
      course_code,
      is_open: true,
      grade: {
        [Op.in]: ['1', '2', '3', '4', '5', 'Hyv.'],
      },
      attainment_date: {
        [Op.gte]: moment('8-1-2020', 'MM-DD-YYYY').toDate(),
      },
    },
  })

  const enrollments = await Enrollment.findAll({
    where: {
      course_code,
      is_open: true,
      enrollment_date_time: {
        [Op.lte]: moment('8-1-2022', 'MM-DD-YYYY').toDate(),
        [Op.gte]: moment('8-1-2020', 'MM-DD-YYYY').toDate(),
      },
    },
  })

  let avoin_credited = []

  for (let credit of credits) {
    const { attainment_date, student_studentnumber: studentnumber } = credit
    const rights = await studyrightsOf(studentnumber)
    if (!hasValidStudyright(rights, attainment_date)) {
      avoin_credited.push(studentnumber)
    }
  }

  let avoin_enrolled = []

  for (let enrollment of enrollments) {
    const { enrollment_date_time, studentnumber } = enrollment
    const rights = await studyrightsOf(studentnumber)
    if (!hasValidStudyright(rights, enrollment_date_time)) {
      avoin_enrolled.push(studentnumber)
    }
  }

  avoin_credited = uniq(avoin_credited)
  avoin_enrolled = uniq(avoin_enrolled)

  return {
    credits,
    enrollments,
    avoin_credited,
    avoin_enrolled,
  }
}

const unifiedCourseInfo = async course_code => {
  const a = await courseInfo(course_code)
  const b = await courseInfo('AY' + course_code)

  avoin_credited = uniq(a.avoin_credited.concat(b.avoin_credited))
  avoin_enrolled = uniq(a.avoin_enrolled.concat(b.avoin_enrolled))

  return {
    credits: uniq(a.credits.concat(b.credits)),
    enrollments: uniq(a.enrollments.concat(b.enrollments)),
    avoin_credited,
    avoin_enrolled,
    only_enrolled: avoin_enrolled.filter(e => !avoin_credited.includes(e)),
  }
}

const statsOf = async courses => {
  console.log(Object.keys(courses).join('\n'))
  console.log()
  let students = []
  for (let course_code of Object.keys(courses)) {
    const { credits, enrollments, avoin_enrolled, avoin_credited, only_enrolled } = await unifiedCourseInfo(course_code)
    courses[course_code] = { credits, enrollments, avoin_enrolled, avoin_credited, only_enrolled }
    students = uniq(students.concat(avoin_enrolled).concat(avoin_credited))
  }

  const rows = []

  for (let s of students) {
    let string = s + ' '
    let score = 0
    for (let course_code of Object.keys(courses)) {
      const { enrollments, avoin_credited, only_enrolled } = courses[course_code]
      let course_info = '-'
      if (avoin_credited.includes(s)) {
        course_info = 'X'
        score += 10
      }

      if (only_enrolled.includes(s)) {
        const studentsEnrolments = enrollments.filter(e => e.studentnumber === s)
        course_info = '' + studentsEnrolments.length

        score += 1
      }

      string += course_info + ' '
    }

    const rights = await studyrightsOf(s)
    const stRight = hasValidStudyright(rights, new Date('2022-8-1')) ? 'yes' : 'no'

    string += stRight

    rows.push({ string, score })
  }

  const byScore = (a, b) => b.score - a.score

  console.log(
    rows
      .sort(byScore)
      .map(r => r.string)
      .join('\n')
  )
}

const main = async () => {
  const courses_psyk_a = {
    'PSYK-111': null,
    'PSYK-121': null,
    'PSYK-131': null,
    'PSYK-141': null,
    'PSYK-181': null,
  }

  const courses_psyk_p = {
    'PSYK-251': null,
    'PSYK-221': null,
    'PSYK-232': null,
    'PSYK-226': null,
    'PSYK-241': null,
    'PSYK-212': null,
  }

  const courses_hist = {
    'HISK-110': null,
    'HISK-120': null,
    'HISK-131A': null,
    'HISK-131': null,
    'HISK-141': null,
    'HISK-142': null,
  }

  await statsOf(courses_psyk_a)
  console.log()
  console.log()
  await statsOf(courses_psyk_p)
  console.log()
  console.log()
  await statsOf(courses_hist)

  process.exit()
}

main()
