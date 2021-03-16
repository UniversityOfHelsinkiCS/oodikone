const { matchExactlyOneCourse } = require('./matchExactlyOneCourse')

const compareCoursesPairwise = (oodiCourses, sisCourses, msg) => {
  let missing = []

  for (const oodiCourse of oodiCourses) {
    try {
      matchExactlyOneCourse(oodiCourse, sisCourses)
    } catch (error) {
      missing = missing.concat(oodiCourse)
      msg = msg.concat(`    ${oodiCourse.course.code} missing from SIS.`)
    }
  }

  if (missing.length > 0) {
    msg = msg.concat(`  Total missing from SIS: ${missing.length}`)
  }

  return msg
}

module.exports = compareCoursesPairwise
