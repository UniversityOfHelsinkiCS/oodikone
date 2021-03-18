const compareCoursesPairwise = require('./compareCoursesPairwise')
const excludeIgnoredCourses = require('./excludeIgnoredCourses')

const compareCourses = async (data, msg) => {
  data.courses = await excludeIgnoredCourses(data)

  //msg = compareTotalCredits(oodi, sis, msg)
  //msg = compareLength(oodi, sis, msg)
  msg = compareCoursesPairwise(data, msg)
  return msg
}

module.exports = {
  compareCourses
}
