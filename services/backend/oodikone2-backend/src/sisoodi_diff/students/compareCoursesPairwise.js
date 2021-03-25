const moment = require('moment')
const { excludeStudyModulesFromCourses } = require('../utils')
const { matchExactlyOneCourse } = require('./matchExactlyOneCourse')
const { output } = require('./output')

// FIXME: ei samaan ämpäriin!
const coursesToIgnore = ['DIGI-100A', 'TKT50003', 'AYTKT50003']

const compareOodiToSis = (data, msg) => {
  const { studentNumber, courses } = data
  const oodiCourses = courses.oodi
  const sisCourses = courses.sis

  let missing = []

  for (const oodiCourse of oodiCourses) {
    const courseCode = oodiCourse.course.code

    try {
      matchExactlyOneCourse(oodiCourse, sisCourses)
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
      msg = msg.concat(`    ${oodiCourse.course.code} missing from SIS.\t\t${date}\t\t${credits}\t\t[${name}]`)
    }
  }

  if (missing.length > 0) {
    msg = msg.concat(`  Total courses missing from SIS: ${missing.length}`)
  }

  return msg
}

const compareCoursesPairwise = (data, msg) => {
  const { courses } = data
  const sis = excludeStudyModulesFromCourses(courses.sis)
  const oodi = excludeStudyModulesFromCourses(courses.oodi)
  msg = compareOodiToSis({ ...data, courses: { sis, oodi } }, msg)
  return msg
}

module.exports = compareCoursesPairwise
