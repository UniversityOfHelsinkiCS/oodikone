const { onlyStudyModulesFromCourses } = require('../utils')
const { matchExactlyOneCourse } = require('./matchExactlyOneCourse')
const moment = require('moment')
const { output } = require('./output')

const coursesToIgnore = ['TKT20009', 'AYTKT20009', 'DIGI-100', 'CSM13204']

const matchOnlyByCreditsAndDateIfNecessary = (courseToPair, courses) => {
  try {
    matchExactlyOneCourse(courseToPair, courses)
  } catch (error) {
    matchExactlyOneCourse(courseToPair, courses, false)
  }
}

const matchStudyModulesAsCourses = (data, msg) => {
  const { studentNumber, courses } = data
  const oodiCourses = courses.oodi
  const sisCourses = courses.sis

  let missing = []

  for (const oodiCourse of oodiCourses) {
    const courseCode = oodiCourse.course.code

    try {
      matchOnlyByCreditsAndDateIfNecessary(oodiCourse, sisCourses)
    } catch (error) {
      if (coursesToIgnore.includes(courseCode)) {
        continue
      }

      missing = missing.concat(oodiCourse)
      const name = oodiCourse.course.name.fi
      output(
        {
          code: courseCode,
          name,
          studentNumber: studentNumber
        },
        'code'
      )

      const date = moment(oodiCourse.date).format('YYYY-MM-DD')
      const { credits } = oodiCourse
      msg = msg.concat(
        `    Study Module: ${oodiCourse.course.code} missing from SIS.\t\t${date}\t\t${credits}\t\t[${name}]`
      )
    }
  }

  if (missing.length > 0) {
    msg = msg.concat(`  Total study modules missing from SIS: ${missing.length}`)
  }

  return msg
}

const compareStudyModules = (data, msg) => {
  const { courses } = data
  const oodi = onlyStudyModulesFromCourses(courses.oodi)
  const sis = onlyStudyModulesFromCourses(courses.sis)

  msg = matchStudyModulesAsCourses({ ...data, courses: { oodi, sis } }, msg)

  return msg
}

module.exports = compareStudyModules
