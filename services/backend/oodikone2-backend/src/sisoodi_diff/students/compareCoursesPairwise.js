const moment = require('moment')

const matchByDate = (date, courses) => {
  const dst = moment(date).hour() === 21
  const tzFix = dst ? 3 : 2
  const oodiDate = moment(date).add(tzFix, 'hours')
  const matches = courses.filter(course => oodiDate.isSame(course.date))
  return matches
}

const findPairFromSis = (oodiCourse, sisCourses) => {
  const { code } = oodiCourse.course
  const codeMatches = sisCourses.filter(({ course }) => course.code === code)
  let courseMatch = null

  if (codeMatches.length > 1) {
    const dateMatches = matchByDate(oodiCourse.date, codeMatches)

    if (dateMatches.length > 1) {
      console.log('WARNING! Found two courses in SIS with matching code and date.')
      console.log(oodiCourse)
      console.log(dateMatches)
      throw new Error()
    }

    // TODO: Add matching by credits after matching by date (lääkis breaks everything as it stands).

    courseMatch = dateMatches[0] || null
  }

  return courseMatch
}

const compareCoursesPairwise = (oodiCourses, sisCourses, msg) => {
  for (const oodiCourse of oodiCourses) {
    const sisCourse = findPairFromSis(oodiCourse, sisCourses)

    if (!sisCourse) {
      msg = msg.concat(`    ${oodiCourse.course.code} not found in SIS.`)
    }
  }

  return msg
}

module.exports = compareCoursesPairwise
