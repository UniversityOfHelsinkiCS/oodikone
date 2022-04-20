const { getStudentsForProgrammeCourses } = require('./studyprogramme')
const { mapToProviders } = require('../util/utils')

const getStudyprogrammeCoursesForStudytrack = async studyprogramme => {
  const providerCode = mapToProviders([studyprogramme])[0]
  const res = await getStudentsForProgrammeCourses(providerCode)
  return res
}

module.exports = { getStudyprogrammeCoursesForStudytrack }
