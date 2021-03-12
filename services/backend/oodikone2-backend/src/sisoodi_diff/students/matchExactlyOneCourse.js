// Idea here is to find exactly one matching course or fail otherwise.
const { mayhemifiedDatesMatch } = require('../utils')

const filterByDate = (date, courses) => courses.filter(course => mayhemifiedDatesMatch(course.date, date))

const filterByCode = (code, courses) => courses.filter(({ course }) => course.code === code)

const filterByCredits = (credits, courses) => courses.filter(course => course.credits === credits)

const coursesMatch = (a, b) =>
  a.course.code === b.course.code && a.credits === b.credits && mayhemifiedDatesMatch(a.date, b.date)

const matchExactlyOneCourse = (courseToPair, courses) => {
  const { code } = courseToPair.course
  const codeMatches = filterByCode(code, courses)

  if (codeMatches.length === 0) {
    console.log('ERROR! Could not match courses.')
    throw new Error()
  }

  if (codeMatches.length === 1 && coursesMatch(courseToPair, codeMatches[0])) {
    return codeMatches[0]
  }

  // Need to filter by date.
  const { date, credits } = courseToPair
  const dateMatches = filterByDate(date, codeMatches)

  if (dateMatches.length === 0) {
    console.log('ERROR! Could not match courses.')
    throw new Error()
  }

  if (dateMatches.length === 1 && coursesMatch(courseToPair, dateMatches[0])) {
    return dateMatches[0]
  }

  // Need to filter by credit.
  const creditsMatches = filterByCredits(credits, dateMatches)

  if (creditsMatches.length !== 1) {
    console.log('ERROR! Could not match courses.')
    throw new Error()
  }

  return creditsMatches[0]
}

module.exports = matchExactlyOneCourse
