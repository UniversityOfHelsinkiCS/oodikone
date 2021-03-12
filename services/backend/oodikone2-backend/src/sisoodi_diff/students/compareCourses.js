const { sum } = require('lodash')
const compareCoursesPairwise = require('./compareCoursesPairwise')
const excludeIgnoredCourses = require('./excludeIgnoredCourses')

const compareTotalCredits = (oodi, sis, msg) => {
  const sumOodi = sum(oodi.map(course => course.credits))
  const sumSis = sum(sis.map(course => course.credits))

  if (sumOodi === sumSis) {
    return msg
  }

  const d = Number(sumSis - sumOodi).toFixed(1)
  return msg.concat(`  student.courses total credits diff:\t${d}`)
}

const compareLength = (oodi, sis, msg) => {
  if (oodi.length === sis.length) {
    return msg
  }

  const d = sis.length - oodi.length
  const missing = d < 0 ? `${d * -1} less in SIS` : `${d} less in Oodi`
  return msg.concat(`  course.length diff:\t\t\t${missing}`)
}

const compareCourses = async (data, msg) => {
  const { oodi, sis } = data.courses
  await excludeIgnoredCourses(data)

  msg = compareTotalCredits(oodi, sis, msg)
  msg = compareLength(oodi, sis, msg)
  msg = compareCoursesPairwise(oodi, sis, msg)
  return msg
}

module.exports = {
  compareCourses
}
