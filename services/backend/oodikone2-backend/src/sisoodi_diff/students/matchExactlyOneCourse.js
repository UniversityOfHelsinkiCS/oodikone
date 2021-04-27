const { mayhemifiedDatesMatch } = require('../utils')

const filterByDate = (date, courses) => courses.filter(course => mayhemifiedDatesMatch(course.date, date))

const filterByCode = (code, courses) => courses.filter(({ course }) => course.code === code)

const filterByCredits = (credits, courses) => courses.filter(course => course.credits === credits)

const filterByGrade = (grade, courses) => courses.filter(course => course.grade === grade)

const coursesMatch = (a, b) => a.credits === b.credits && mayhemifiedDatesMatch(a.date, b.date)

// Idea here is to find exactly one matching course or fail otherwise.
const matchExactlyOneCourse = (courseToPair, courses, matchByCode = true) => {
  const { code } = courseToPair.course
  const exactCodeMatches = filterByCode(code, courses)

  // Try to fall back to the special 99999 code used for courses that are missing from SIS.
  // This is done so that the script can try matching the courses by credits and date instead of just skipping 99999's.
  // TODO: Eventually diff should succeed with this bit removed!
  const specialCodeMatches = filterByCode('99999 - MISSING FROM SIS', courses)

  const codeMatches = exactCodeMatches.length > 0 ? exactCodeMatches : specialCodeMatches

  if (codeMatches.length === 0 && matchByCode) {
    throw new Error('ERROR! Could not match course (code).')
  }

  if (codeMatches.length === 1 && coursesMatch(courseToPair, codeMatches[0])) {
    return codeMatches[0]
  }

  // Need to filter by date.
  const toBeSeacrhedByDate = matchByCode ? codeMatches : courses
  const { date, credits } = courseToPair
  const dateMatches = filterByDate(date, toBeSeacrhedByDate)

  if (dateMatches.length === 0) {
    throw new Error('ERROR! Could not match courses (date).')
  }

  if (dateMatches.length === 1 && coursesMatch(courseToPair, dateMatches[0])) {
    return dateMatches[0]
  }

  // Need to filter by credit.
  const creditsMatches = filterByCredits(credits, dateMatches)

  if (creditsMatches.length === 0) {
    throw new Error('ERROR! Could not match courses (credits).')
  }

  // Need to filter by grade.
  const { grade } = courseToPair
  const gradeMatches = filterByGrade(grade, creditsMatches)

  if (gradeMatches.length !== 1) {
    throw new Error('ERROR! Could not match courses (credits).')
  }

  return creditsMatches[0]
}

module.exports = { matchExactlyOneCourse }
