const { sum } = require('lodash')
const ignoredCourses = require('./ignoredCourses')

const excludeIgnoredCourses = courses =>
  courses.filter(({ course }) => {
    const { code } = course
    return !ignoredCourses.includes(code)
  })

const compareTotalCredits = (oodi, sis, msg) => {
  oodi = excludeIgnoredCourses(oodi)
  sis = excludeIgnoredCourses(sis)

  const sumOodi = sum(oodi.map(course => course.credits))
  const sumSis = sum(sis.map(course => course.credits))

  if (sumOodi === sumSis) {
    return msg
  }

  const d = Number(sumSis - sumOodi).toFixed(1)

  return msg.concat(`  course.credits diff:\t\t${d}`)
}

const compareCourses = (oodi, sis, msg) => {
  msg = compareTotalCredits(oodi, sis, msg)
  return msg
}

module.exports = {
  compareCourses
}
