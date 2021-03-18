const axios = require('axios')
const { mayhemifiedDatesMatch } = require('../utils')
const { matchExactlyOneCourse } = require('./matchExactlyOneCourse')

const getMissingAttainments = async studentNumber => {
  const token = process.env.IMPORTER_ARCHAEOLOGY_TOKEN
  const url = `https://importer.cs.helsinki.fi/archeology/${studentNumber}/missing?token=${token}`
  const res = await axios.get(url)
  return res.data
}

const matchFuckedCourses = (search, courses) => {
  const dateMatches = courses.filter(course => mayhemifiedDatesMatch(search.date, course.date))
  const matches = dateMatches.filter(course => search.credits === course.credits)
  return matches
}

const excludeIgnoredCourses = async ({ courses, studentNumber }) => {
  const missingAttainmentIds = (await getMissingAttainments(studentNumber)).map(att => att.id)

  // Remember what SIS courses were filtered out because of missing attainments in order
  // to remove corresponding courses from Oodi data with good confidence.
  const removedFromSis = []
  const sis = courses.sis.filter(course => {
    const missing = missingAttainmentIds.includes(course.id)
    if (missing) {
      removedFromSis.push(course)
    }
    return !missing
  })
  //console.log(removedFromSis)

  //const oodiCoursesToRemove = removedFromSis.map(course => matchExactlyOneCourse(course, courses.oodi))
  let { oodi } = courses
  const notRemovedFromOodi = []

  for (const c of removedFromSis) {
    try {
      oodi = oodi.filter(course => course !== matchExactlyOneCourse(c, oodi))
    } catch (error) {
      notRemovedFromOodi.push(c)
    }
  }

  // If all fucked courses could not be removed by matching, try to remove all of them
  // at once, if dates, credits and the number of such courses match.
  let susCourses = []
  for (const course of notRemovedFromOodi) {
    susCourses = susCourses.concat(matchFuckedCourses(course, oodi))
  }

  if (susCourses.length === notRemovedFromOodi.length) {
    oodi = oodi.filter(course => !susCourses.includes(course))
  }

  return { sis, oodi }
}

module.exports = excludeIgnoredCourses
