const moment = require('moment')
const { matchExactlyOneCourse } = require('./matchExactlyOneCourse')
const { output } = require('./output')

// TODO: lista puuttuvista kurssikoodeista (CSV koodi, nimi)

// FIXME: ei samaan ämpäriin!
const coursesToIgnore = ['DIGI-100A', 'TKT50003', 'AYTKT50003']

const compareOodiToSis = (oodiCourses, sisCourses, msg) => {
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
      output(courseCode, 'code')

      const name = oodiCourse.course.name.fi
      const date = moment(oodiCourse.date).format('YYYY-MM-DD')
      const { credits } = oodiCourse
      msg = msg.concat(`    ${oodiCourse.course.code} missing from SIS.\t\t${date}\t\t${credits}\t\t[${name}]`)
    }
  }

  if (missing.length > 0) {
    msg = msg.concat(`  Total missing from SIS: ${missing.length}`)
  }

  return msg
}

const compareCoursesPairwise = (oodiCourses, sisCourses, msg) => {
  msg = compareOodiToSis(oodiCourses, sisCourses, msg)
  return msg
}

module.exports = compareCoursesPairwise
