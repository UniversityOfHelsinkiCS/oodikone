const { mean } = require('lodash')

// Helper functions
const formatStudyright = studyright => {
  const { studyrightid, studystartdate, enddate, graduated, prioritycode, extentcode, student } = studyright
  return {
    studyrightid,
    studystartdate,
    enddate,
    graduated,
    prioritycode,
    extentcode,
    studentnumber: student.studentnumber,
  }
}

const getYearsArray = (since, isAcademicYear) => {
  const years = []
  for (let i = since; i <= new Date().getFullYear(); i++) {
    const year = isAcademicYear ? `${i} - ${i + 1}` : i
    years.push(year)
  }
  return years
}

const getYearsObject = (years, emptyArrays = false) => {
  let yearsObject = {}
  for (const year of years) {
    yearsObject = { ...yearsObject, [year]: emptyArrays ? [] : 0 }
  }
  return yearsObject
}

const getStatsBasis = years => {
  return {
    graphStats: new Array(years.length).fill(0),
    tableStats: getYearsObject(years),
  }
}

const isMajorStudentCredit = (studyright, attainment_date) =>
  studyright &&
  (studyright.prioritycode === 1 || studyright.prioritycode === 30) && // Is studyright state = MAIN or state = GRADUATED
  studyright.studystartdate <= attainment_date && // Has the credit been attained after studying in the programme started
  studyright.enddate >= attainment_date && // Has the credit been attained before the studyright ended
  (!studyright.canceldate || studyright.canceldate >= attainment_date) // If the studyright was cancelled, was the credit attained before it was cancelled

const getMedian = values => {
  if (values.length === 0) return 0
  values.sort((a, b) => a - b)
  const half = Math.floor(values.length / 2)
  if (values.length % 2) return values[half]
  return (values[half - 1] + values[half]) / 2.0
}

const getMean = values => {
  if (values.length === 0) return 0
  return Math.round(mean(values))
}

const defineYear = (date, isAcademicYear) => {
  if (!date) return ''
  const year = date.getFullYear()
  if (!isAcademicYear) return year
  if (date < new Date(`${year}-07-31`)) return `${year - 1} - ${year}`
  return `${year} - ${year + 1}`
}

const getStartDate = (studyprogramme, isAcademicYear) => {
  if ((studyprogramme.includes('KH') || studyprogramme.includes('MH')) && isAcademicYear) return new Date('2017-08-01')
  if (studyprogramme.includes('KH') || studyprogramme.includes('MH')) return new Date('2017-01-01')
  if (isAcademicYear) return new Date('2000-08-01')
  return new Date('2000-01-01')
}

module.exports = {
  formatStudyright,
  getYearsArray,
  getYearsObject,
  getStatsBasis,
  isMajorStudentCredit,
  getMedian,
  getMean,
  defineYear,
  getStartDate,
}
