const axios = require('axios')

const getMissingAttainments = async studentNumber => {
  const token = process.env.IMPORTER_ARCHAEOLOGY_TOKEN
  const url = `https://importer.cs.helsinki.fi/archeology/${studentNumber}/missing?token=${token}`
  const res = await axios.get(url)
  return res.data
}

const excludeIgnoredCourses = async ({ courses, studentNumber }) => {
  const missingAttainmentIds = (await getMissingAttainments(studentNumber)).map(att => att.id)

  // Remove SIS courses that have missing attainments.
  const filteredCourses = {
    sis: courses.sis.filter(course => !missingAttainmentIds.includes(course.id)),
    // FIXME: Remove related courses from Oodi as well
    oodi: courses.oodi
  }

  return filteredCourses
}

module.exports = excludeIgnoredCourses
