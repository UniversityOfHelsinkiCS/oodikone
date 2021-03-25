const compareCoursesPairwise = require('./compareCoursesPairwise')
const compareStudyModules = require('./compareStudyModules')
const excludeIgnoredCourses = require('./excludeIgnoredCourses')

const compareCourses = async (data, msg) => {
  data.courses = await excludeIgnoredCourses(data)

  //msg = compareTotalCredits(oodi, sis, msg)
  //msg = compareLength(oodi, sis, msg)
  msg = compareCoursesPairwise(data, msg)
  msg = compareStudyModules(data, msg)
  return msg
}

module.exports = {
  compareCourses
}
